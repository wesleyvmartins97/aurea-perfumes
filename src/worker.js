export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================
    // MELHOR ENVIO
    // =========================
    if (url.pathname === "/api/frete" && request.method === "POST") {
      return calcularFrete(request, env);
    }

    // =========================
    // MERCADO PAGO - CRIAR PEDIDO
    // =========================
    if (url.pathname === "/api/pagamento" && request.method === "POST") {
      return criarPagamento(request, env);
    }

    // =========================
    // MERCADO PAGO - CONSULTAR PEDIDO
    // =========================
    if (
      url.pathname.startsWith("/api/pagamento/") &&
      request.method === "GET"
    ) {
      const orderId = url.pathname.split("/").pop();

      if (!orderId) {
        return resposta({
          error: "ID do pedido não informado."
        }, 400);
      }

      return consultarPagamento(orderId, env);
    }

    return new Response("AURÉA Worker funcionando.", {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=UTF-8"
      }
    });
  }
};


// ======================================================
// MELHOR ENVIO
// ======================================================

async function calcularFrete(request, env) {
  try {
    const dados = await request.json();
    const cep = String(dados.cep || "").replace(/\D/g, "");

    if (!/^\d{8}$/.test(cep)) {
      return resposta({
        error: "CEP inválido."
      }, 400);
    }

    if (!env.MELHOR_ENVIO_TOKEN) {
      return resposta({
        error: "MELHOR_ENVIO_TOKEN não configurado."
      }, 500);
    }

    if (!env.AUREA_ORIGIN_CEP) {
      return resposta({
        error: "AUREA_ORIGIN_CEP não configurado."
      }, 500);
    }

    const produto = dados.produto || {};

    const quantidade = Math.max(
      1,
      Number(dados.quantidade || 1)
    );

    const consulta = {
      from: {
        postal_code: String(
          env.AUREA_ORIGIN_CEP
        ).replace(/\D/g, "")
      },

      to: {
        postal_code: cep
      },

      products: [
        {
          id: String(
            produto.nome || "Perfume AURÉA"
          ),

          width: Number(
            produto.largura || 20
          ),

          height: Number(
            produto.altura || 10
          ),

          length: Number(
            produto.comprimento || 15
          ),

          weight: Number(
            produto.peso || 0.6
          ),

          insurance_value: Number(
            produto.valor || 0
          ),

          quantity: quantidade
        }
      ]
    };

    const respostaMelhorEnvio = await fetch(
      "https://melhorenvio.com.br/api/v2/me/shipment/calculate",
      {
        method: "POST",

        headers: {
          "Authorization":
            `Bearer ${env.MELHOR_ENVIO_TOKEN}`,

          "Accept":
            "application/json",

          "Content-Type":
            "application/json",

          "User-Agent":
            "AUREA Perfumes"
        },

        body: JSON.stringify(consulta)
      }
    );

    const resultado =
      await respostaMelhorEnvio.json();

    if (!respostaMelhorEnvio.ok) {
      return resposta({
        error:
          "O Melhor Envio recusou a cotação.",

        details:
          resultado
      }, respostaMelhorEnvio.status);
    }

    const fretes =
      Array.isArray(resultado)
        ? resultado
            .filter(
              item =>
                item &&
                (
                  item.price != null ||
                  item.custom_price != null
                )
            )
            .map(item => ({
              id:
                item.id,

              company:
                item.company?.name ||
                item.company ||
                "Transportadora",

              name:
                item.name ||
                "Frete",

              price:
                Number(
                  item.custom_price ??
                  item.price ??
                  0
                ),

              delivery_time:
                Number(
                  item.custom_delivery_time ??
                  item.delivery_time ??
                  0
                )
            }))
        : [];

    return resposta(fretes);

  } catch (erro) {
    return resposta({
      error:
        erro?.message ||
        "Erro interno ao calcular o frete."
    }, 500);
  }
}


// ======================================================
// MERCADO PAGO
// ======================================================

async function criarPagamento(request, env) {
  try {
    if (!env.MERCADOPAGO_ACCESS_TOKEN) {
      return resposta({
        error:
          "MERCADOPAGO_ACCESS_TOKEN não configurado."
      }, 500);
    }

    const dados = await request.json();

    const total = Number(
      dados.total || 0
    );

    if (!Number.isFinite(total) || total <= 0) {
      return resposta({
        error:
          "Valor total do pedido inválido."
      }, 400);
    }

    const cliente = dados.cliente || {};

    const email =
      String(
        cliente.email || ""
      ).trim();

    if (!email) {
      return resposta({
        error:
          "E-mail do cliente não informado."
      }, 400);
    }

    const nomeCompleto =
      String(
        cliente.nome || ""
      ).trim();

    const partesNome =
      nomeCompleto
        .split(/\s+/)
        .filter(Boolean);

    const firstName =
      partesNome[0] ||
      "Cliente";

    const lastName =
      partesNome.slice(1).join(" ") ||
      "AUREA";

    const cpf =
      String(
        cliente.cpf || ""
      ).replace(/\D/g, "");

    const telefone =
      String(
        cliente.telefone || ""
      ).replace(/\D/g, "");

    const cep =
      String(
        cliente.cep || ""
      ).replace(/\D/g, "");

    const rua =
      String(
        cliente.rua || ""
      ).trim();

    const numero =
      String(
        cliente.numero || ""
      ).trim();

    const bairro =
      String(
        cliente.bairro || ""
      ).trim();

    const cidade =
      String(
        cliente.cidade || ""
      ).trim();

    const estado =
      String(
        cliente.estado || ""
      ).trim();

    const complemento =
      String(
        cliente.complemento || ""
      ).trim();

    const pagamento =
      String(
        dados.pagamento || "pix"
      ).toLowerCase();

    const referencia =
      `AUREA-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    // --------------------------------------------------
    // PAGAMENTO PIX
    // --------------------------------------------------

    if (pagamento === "pix") {
      const body = {
        type: "online",

        external_reference:
          referencia,

        total_amount:
          total.toFixed(2),

        payer: {
          email,

          first_name:
            firstName,

          last_name:
            lastName,

          entity_type:
            "individual",

          ...(cpf
            ? {
                identification: {
                  type: "CPF",
                  number: cpf
                }
              }
            : {}),

          ...(telefone
            ? {
                phone: {
                  area_code:
                    telefone.slice(0, 2),

                  number:
                    telefone.slice(2)
                }
              }
            : {}),

          ...(cep
            ? {
                address: {
                  zip_code:
                    cep,

                  street_name:
                    rua,

                  street_number:
                    numero,

                  neighborhood:
                    bairro,

                  city:
                    cidade,

                  state:
                    estado,

                  ...(complemento
                    ? {
                        complement:
                          complemento
                      }
                    : {})
                }
              }
            : {})
        },

        transactions: {
          payments: [
            {
              amount:
                total.toFixed(2),

              payment_method: {
                id: "pix",
                type: "bank_transfer"
              }
            }
          ]
        },

        capture_mode:
          "automatic",

        processing_mode:
          "automatic",

        description:
          "Pedido AUREA Perfumes"
      };

      return enviarOrderMercadoPago(
        body,
        env,
        referencia
      );
    }

    // --------------------------------------------------
    // CARTÃO
    // --------------------------------------------------

    if (pagamento === "cartao") {
      const cartao =
        dados.cartao || {};

      const token =
        String(
          cartao.token || ""
        ).trim();

      const paymentMethodId =
        String(
          cartao.payment_method_id || ""
        ).trim();

      const installments =
        Math.max(
          1,
          Number(
            cartao.installments || 1
          )
        );

      if (!token) {
        return resposta({
          error:
            "Token do cartão não informado."
        }, 400);
      }

      if (!paymentMethodId) {
        return resposta({
          error:
            "Forma de pagamento do cartão não informada."
        }, 400);
      }

      const body = {
        type: "online",

        external_reference:
          referencia,

        total_amount:
          total.toFixed(2),

        payer: {
          email,

          first_name:
            firstName,

          last_name:
            lastName,

          entity_type:
            "individual",

          ...(cpf
            ? {
                identification: {
                  type: "CPF",
                  number: cpf
                }
              }
            : {}),

          ...(telefone
            ? {
                phone: {
                  area_code:
                    telefone.slice(0, 2),

                  number:
                    telefone.slice(2)
                }
              }
            : {})
        },

        transactions: {
          payments: [
            {
              amount:
                total.toFixed(2),

              payment_method: {
                id:
                  paymentMethodId,

                type:
                  "credit_card",

                token,

                installments
              }
            }
          ]
        },

        capture_mode:
          "automatic",

        processing_mode:
          "automatic",

        description:
          "Pedido AUREA Perfumes"
      };

      return enviarOrderMercadoPago(
        body,
        env,
        referencia
      );
    }

    return resposta({
      error:
        "Forma de pagamento inválida."
    }, 400);

  } catch (erro) {
    return resposta({
      error:
        erro?.message ||
        "Erro interno ao criar pagamento."
    }, 500);
  }
}


// ======================================================
// ENVIAR ORDER PARA MERCADO PAGO
// ======================================================

async function enviarOrderMercadoPago(
  body,
  env,
  referencia
) {
  const idempotencyKey =
    crypto.randomUUID();

  const respostaMP =
    await fetch(
      "https://api.mercadopago.com/v1/orders",
      {
        method: "POST",

        headers: {
          "Authorization":
            `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}`,

          "Content-Type":
            "application/json",

          "X-Idempotency-Key":
            idempotencyKey
        },

        body:
          JSON.stringify(body)
      }
    );

  const resultado =
    await respostaMP.json();

  if (!respostaMP.ok) {
    return resposta({
      error:
        "O Mercado Pago recusou a criação do pagamento.",

      status:
        respostaMP.status,

      details:
        resultado
    }, respostaMP.status);
  }

  const payment =
    resultado
      ?.transactions
      ?.payments?.[0];

  return resposta({
    success: true,

    order_id:
      resultado.id,

    external_reference:
      referencia,

    status:
      resultado.status,

    status_detail:
      resultado.status_detail,

    payment_id:
      payment?.id || null,

    payment_status:
      payment?.status || null,

    payment_status_detail:
      payment?.status_detail || null,

    payment_method:
      payment?.payment_method || null
  }, 201);
}


// ======================================================
// CONSULTAR ORDER
// ======================================================

async function consultarPagamento(
  orderId,
  env
) {
  try {
    if (!env.MERCADOPAGO_ACCESS_TOKEN) {
      return resposta({
        error:
          "MERCADOPAGO_ACCESS_TOKEN não configurado."
      }, 500);
    }

    const respostaMP =
      await fetch(
        `https://api.mercadopago.com/v1/orders/${encodeURIComponent(orderId)}`,
        {
          method: "GET",

          headers: {
            "Authorization":
              `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}`,

            "Content-Type":
              "application/json"
          }
        }
      );

    const resultado =
      await respostaMP.json();

    if (!respostaMP.ok) {
      return resposta({
        error:
          "Não foi possível consultar o pedido no Mercado Pago.",

        status:
          respostaMP.status,

        details:
          resultado
      }, respostaMP.status);
    }

    return resposta({
      success: true,

      order_id:
        resultado.id,

      status:
        resultado.status,

      status_detail:
        resultado.status_detail,

      total_amount:
        resultado.total_amount,

      transactions:
        resultado.transactions || null
    });

  } catch (erro) {
    return resposta({
      error:
        erro?.message ||
        "Erro interno ao consultar pagamento."
    }, 500);
  }
}


// ======================================================
// RESPOSTA JSON
// ======================================================

function resposta(
  dados,
  status = 200
) {
  return new Response(
    JSON.stringify(dados),
    {
      status,

      headers: {
        "Content-Type":
          "application/json; charset=UTF-8",

        "Cache-Control":
          "no-store"
      }
    }
  );
}
