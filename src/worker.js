export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/frete" && request.method === "POST") {
      return calcularFrete(request, env);
    }

    if (url.pathname === "/api/pagamento" && request.method === "POST") {
      return criarPagamentoPix(request, env);
    }

    if (url.pathname.startsWith("/api/pagamento/") && request.method === "GET") {
      const orderId = url.pathname.substring("/api/pagamento/".length).trim();

      if (!orderId) {
        return resposta(
          {
            ok: false,
            error: "ID do pedido não informado."
          },
          400
        );
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

    const cep = String(
      dados.cep || ""
    ).replace(/\D/g, "");

    if (!/^\d{8}$/.test(cep)) {
      return resposta(
        {
          error: "CEP inválido."
        },
        400
      );
    }

    if (!env.MELHOR_ENVIO_TOKEN) {
      return resposta(
        {
          error: "MELHOR_ENVIO_TOKEN não configurado."
        },
        500
      );
    }

    if (!env.AUREA_ORIGIN_CEP) {
      return resposta(
        {
          error: "AUREA_ORIGIN_CEP não configurado."
        },
        500
      );
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
            "Bearer " + env.MELHOR_ENVIO_TOKEN,

          "Accept":
            "application/json",

          "Content-Type":
            "application/json",

          "User-Agent":
            "AUREA Perfumes"
        },

        body:
          JSON.stringify(consulta)
      }
    );

    const textoResultado =
      await respostaMelhorEnvio.text();

    let resultado;

    try {
      resultado =
        JSON.parse(
          textoResultado
        );
    } catch {
      resultado = {
        raw:
          textoResultado
      };
    }

    if (!respostaMelhorEnvio.ok) {
      return resposta(
        {
          error:
            "O Melhor Envio recusou a cotação.",

          details:
            resultado
        },
        respostaMelhorEnvio.status
      );
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
            .map(
              item => ({
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
              })
            )
        : [];

    return resposta(
      fretes
    );

  } catch (erro) {

    console.error(
      "Erro Melhor Envio:",
      erro
    );

    return resposta(
      {
        error:
          erro?.message ||
          "Erro interno ao calcular o frete."
      },
      500
    );
  }
}


// ======================================================
// MERCADO PAGO - CRIAR PIX REAL (CORRIGIDO /v1/payments)
// ======================================================

async function criarPagamentoPix(request, env) {
  try {
    if (!env.MERCADOPAGO_ACCESS_TOKEN) {
      return resposta(
        {
          ok: false,
          error: "MERCADOPAGO_ACCESS_TOKEN não configurado."
        },
        500
      );
    }

    const dados = await request.json();

    const metodoSolicitado = String(
      dados.paymentMethod || ""
    )
      .trim()
      .toLowerCase();

    if (metodoSolicitado !== "pix") {
      return resposta(
        {
          ok: false,
          error: "Neste momento o pagamento disponível é PIX."
        },
        400
      );
    }

    const nome = String(dados.name || "").trim();
    if (nome.length < 3) {
      return resposta(
        {
          ok: false,
          error: "Nome inválido."
        },
        400
      );
    }

    const email = String(dados.email || "")
      .trim()
      .toLowerCase();

    if (
      !email ||
      !email.includes("@") ||
      !email.includes(".")
    ) {
      return resposta(
        {
          ok: false,
          error: "E-mail inválido."
        },
        400
      );
    }

    const cpf = String(dados.cpf || "").replace(/\D/g, "");
    if (cpf.length !== 11) {
      return resposta(
        {
          ok: false,
          error: "CPF inválido."
        },
        400
      );
    }

    const telefone = String(dados.phone || "").replace(/\D/g, "");

    const total = Number(dados.total);
    if (!Number.isFinite(total) || total <= 0) {
      return resposta(
        {
          ok: false,
          error: "Valor total inválido."
        },
        400
      );
    }

    const partesNome = nome.split(/\s+/).filter(Boolean);
    const primeiroNome = partesNome.shift() || "Cliente";
    const sobrenome = partesNome.join(" ") || "AUREA";

    const referencia =
      "AUREA-" +
      Date.now() +
      "-" +
      crypto.randomUUID().slice(0, 8);

    const pagamentoData = {
      transaction_amount: Number(total.toFixed(2)),
      description: "Pedido AURÉA Perfumes - Ref: " + referencia,
      payment_method_id: "pix",
      external_reference: referencia,
      payer: {
        email: email,
        first_name: primeiroNome,
        last_name: sobrenome,
        identification: {
          type: "CPF",
          number: cpf
        }
      }
    };

    if (telefone.length >= 10) {
      pagamentoData.payer.phone = {
        area_code: telefone.substring(0, 2),
        number: telefone.substring(2)
      };
    }

    const respostaMercadoPago = await fetch(
      "https://api.mercadopago.com/v1/payments",
      {
        method: "POST",
        headers: {
          "Authorization":
            "Bearer " + env.MERCADOPAGO_ACCESS_TOKEN,
          "Content-Type":
            "application/json",
          "Accept":
            "application/json",
          "X-Idempotency-Key":
            crypto.randomUUID()
        },
        body: JSON.stringify(pagamentoData)
      }
    );

    const textoResultado = await respostaMercadoPago.text();
    let resultado;

    try {
      resultado = JSON.parse(textoResultado);
    } catch {
      resultado = {
        raw: textoResultado
      };
    }

    if (!respostaMercadoPago.ok) {
      console.error(
        "Mercado Pago recusou PIX:",
        JSON.stringify(resultado)
      );

      return resposta(
        {
          ok: false,
          error: "O Mercado Pago recusou o pagamento.",
          message:
            resultado?.message ||
            resultado?.error ||
            "Erro retornado pelo Mercado Pago.",
          details:
            resultado?.cause ||
            resultado?.details ||
            resultado?.errors ||
            null,
          status: respostaMercadoPago.status
        },
        respostaMercadoPago.status
      );
    }

    const dadosQrCode =
      resultado?.point_of_interaction?.transaction_data || {};

    return resposta(
      {
        ok: true,
        orderId: resultado.id || null,
        paymentId: resultado.id || null,
        status: resultado.status || "pending",
        statusDetail: resultado.status_detail || "waiting_transfer",
        amount: total.toFixed(2),
        siteAmount: total.toFixed(2),
        qrCode: dadosQrCode.qr_code || "",
        qrCodeBase64: dadosQrCode.qr_code_base64 || "",
        ticketUrl: dadosQrCode.ticket_url || "",
        externalReference: referencia,
        testMode: false
      }
    );

  } catch (erro) {
    console.error("Erro interno PIX:", erro);

    return resposta(
      {
        ok: false,
        error:
          erro?.message ||
          "Erro interno ao criar pagamento PIX."
      },
      500
    );
  }
}


// ======================================================
// MERCADO PAGO - CONSULTAR PEDIDO
// ======================================================

async function consultarPagamento(
  orderId,
  env
) {
  try {
    if (
      !env.MERCADOPAGO_ACCESS_TOKEN
    ) {
      return resposta(
        {
          ok: false,
          error: "MERCADOPAGO_ACCESS_TOKEN não configurado."
        },
        500
      );
    }

    // Como alteramos para /v1/payments, a consulta individual usa /v1/payments/{id}
    const respostaMercadoPago =
      await fetch(
        "https://api.mercadopago.com/v1/payments/" +
        encodeURIComponent(
          orderId
        ),
        {
          method: "GET",
          headers: {
            "Authorization":
              "Bearer " +
              env.MERCADOPAGO_ACCESS_TOKEN,
            "Accept":
              "application/json"
          }
        }
      );

    const textoResultado =
      await respostaMercadoPago.text();

    let resultado;

    try {
      resultado =
        JSON.parse(
          textoResultado
        );
    } catch {
      resultado = {
        raw:
          textoResultado
      };
    }

    if (
      !respostaMercadoPago.ok
    ) {
      return resposta(
        {
          ok: false,
          error: "Não foi possível consultar o pagamento.",
          message:
            resultado?.message ||
            resultado?.error ||
            "Erro do Mercado Pago.",
          details:
            resultado?.cause ||
            resultado?.details ||
            resultado?.errors ||
            resultado?.raw ||
            null
        },
        respostaMercadoPago.status
      );
    }

    return resposta(
      {
        ok: true,
        orderId: resultado.id || orderId,
        status: resultado.status || null,
        statusDetail: resultado.status_detail || null,
        paymentId: resultado.id || null
      }
    );

  } catch (erro) {
    return resposta(
      {
        ok: false,
        error:
          erro?.message ||
          "Erro ao consultar pagamento."
      },
      500
    );
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
    JSON.stringify(
      dados
    ),
    {
      status:
        status,

      headers: {
        "Content-Type":
          "application/json; charset=UTF-8",

        "Cache-Control":
          "no-store",

        "Access-Control-Allow-Origin":
          "*"
      }
    }
  );
}
