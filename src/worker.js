export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ================================
    // MELHOR ENVIO
    // ================================
    if (
      url.pathname === "/api/frete" &&
      request.method === "POST"
    ) {
      return calcularFrete(request, env);
    }

    // ================================
    // MERCADO PAGO - PIX
    // ================================
    if (
      url.pathname === "/api/pagamento" &&
      request.method === "POST"
    ) {
      return criarPagamentoPix(request, env);
    }

    // ================================
    // CONSULTAR PEDIDO MERCADO PAGO
    // ================================
    if (
      url.pathname.startsWith("/api/pagamento/") &&
      request.method === "GET"
    ) {
      const orderId = url.pathname
        .replace("/api/pagamento/", "")
        .trim();

      if (!orderId) {
        return resposta({
          ok: false,
          error: "ID do pedido não informado."
        }, 400);
      }

      return consultarPagamento(orderId, env);
    }

    return new Response(
      "AURÉA Worker funcionando.",
      {
        status: 200,
        headers: {
          "Content-Type":
            "text/plain; charset=UTF-8"
        }
      }
    );
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
      return resposta({
        error: "CEP inválido."
      }, 400);
    }

    if (!env.MELHOR_ENVIO_TOKEN) {
      return resposta({
        error:
          "MELHOR_ENVIO_TOKEN não configurado."
      }, 500);
    }

    if (!env.AUREA_ORIGIN_CEP) {
      return resposta({
        error:
          "AUREA_ORIGIN_CEP não configurado."
      }, 500);
    }

    const produto =
      dados.produto || {};

    const quantidade =
      Math.max(
        1,
        Number(
          dados.quantidade || 1
        )
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
            produto.nome ||
            "Perfume AURÉA"
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

    const respostaMelhorEnvio =
      await fetch(
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

          body:
            JSON.stringify(consulta)
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
              id: item.id,

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
// MERCADO PAGO - CRIAR PIX
// ======================================================

async function criarPagamentoPix(
  request,
  env
) {
  try {
    if (!env.MERCADOPAGO_ACCESS_TOKEN) {
      return resposta({
        ok: false,
        error:
          "MERCADOPAGO_ACCESS_TOKEN não configurado."
      }, 500);
    }

    const dados =
      await request.json();

    const paymentMethod =
      String(
        dados.paymentMethod || ""
      ).toLowerCase();

    if (paymentMethod !== "pix") {
      return resposta({
        ok: false,
        error:
          "Neste momento apenas PIX está disponível."
      }, 400);
    }

    const email =
      String(
        dados.email || ""
      ).trim()
      .toLowerCase();

    if (
      !email ||
      !email.includes("@") ||
      !email.includes(".")
    ) {
      return resposta({
        ok: false,
        error:
          "E-mail inválido."
      }, 400);
    }

    const name =
      String(
        dados.name || ""
      ).trim();

    if (name.length < 3) {
      return resposta({
        ok: false,
        error:
          "Nome inválido."
      }, 400);
    }

    const cpf =
      String(
        dados.cpf || ""
      ).replace(/\D/g, "");

    if (cpf.length !== 11) {
      return resposta({
        ok: false,
        error:
          "CPF inválido."
      }, 400);
    }

    const items =
      Array.isArray(dados.items)
        ? dados.items
        : [];

    if (!items.length) {
      return resposta({
        ok: false,
        error:
          "Carrinho vazio."
      }, 400);
    }

    const total =
      Number(dados.total);

    if (
      !Number.isFinite(total) ||
      total <= 0
    ) {
      return resposta({
        ok: false,
        error:
          "Valor total inválido."
      }, 400);
    }

    const shipping =
      dados.shipping || {};

    const shippingPrice =
      Number(
        shipping.price || 0
      );

    if (
      !Number.isFinite(shippingPrice) ||
      shippingPrice < 0
    ) {
      return resposta({
        ok: false,
        error:
          "Valor do frete inválido."
      }, 400);
    }

    // ------------------------------------------
    // Nome
    // ------------------------------------------

    const partesNome =
      name
        .split(/\s+/)
        .filter(Boolean);

    const firstName =
      partesNome.shift() ||
      "Cliente";

    const lastName =
      partesNome.join(" ") ||
      "AUREA";

    // ------------------------------------------
    // Telefone
    // ------------------------------------------

    const phone =
      String(
        dados.phone || ""
      ).replace(/\D/g, "");

    // ------------------------------------------
    // Endereço
    // ------------------------------------------

    const address =
      dados.address || {};

    const cep =
      String(
        address.cep || ""
      ).replace(/\D/g, "");

    // ------------------------------------------
    // Produtos
    // ------------------------------------------

    const mercadoPagoItems =
      items.map((item, index) => {
        const quantity =
          Math.max(
            1,
            Number(
              item.quantity || 1
            )
          );

        const price =
          Number(
            item.price || 0
          );

        return {
          id:
            String(
              item.id ||
              `AUREA-${index + 1}`
            ),

          title:
            String(
              item.name ||
              "Perfume AURÉA"
            ),

          description:
            String(
              item.description ||
              item.name ||
              "Produto AURÉA Perfumes"
            ),

          quantity,

          unit_price:
            Number(
              price.toFixed(2)
            )
        };
      });

    // ------------------------------------------
    // Referência externa
    // ------------------------------------------

    const externalReference =
      `AUREA-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    // ------------------------------------------
    // Order Mercado Pago
    // ------------------------------------------

    const order = {
      type: "online",

      processing_mode:
        "automatic",

      external_reference:
        externalReference,

      total_amount:
        total.toFixed(2),

      description:
        "Pedido AURÉA Perfumes",

      items:
        mercadoPagoItems,

      transactions: {
        payments: [
          {
            amount:
              total.toFixed(2),

            payment_method: {
              id: "pix",
              type: "bank_transfer"
            },

            // PIX válido por 24 horas
            expiration_time:
              "PT24H"
          }
        ]
      },

      payer: {
        email,

        first_name:
          firstName,

        last_name:
          lastName,

        identification: {
          type: "CPF",
          number: cpf
        }
      }
    };

    // ------------------------------------------
    // Adiciona telefone
    // ------------------------------------------

    if (phone.length >= 10) {
      order.payer.phone = {
        area_code:
          phone.slice(
            0,
            2
          ),

        number:
          phone.slice(
            2
          )
      };
    }

    // ------------------------------------------
    // Adiciona endereço
    // ------------------------------------------

    if (/^\d{8}$/.test(cep)) {
      order.payer.address = {
        zip_code: cep,

        street_name:
          String(
            address.street || ""
          ).trim(),

        street_number:
          String(
            address.number || ""
          ).trim()
      };
    }

    // ------------------------------------------
    // Chamada Mercado Pago
    // ------------------------------------------

    const mpResponse =
      await fetch(
        "https://api.mercadopago.com/v1/orders",
        {
          method: "POST",

          headers: {
            "Authorization":
              `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}`,

            "Content-Type":
              "application/json",

            "Accept":
              "application/json",

            "X-Idempotency-Key":
              crypto.randomUUID()
          },

          body:
            JSON.stringify(order)
        }
      );

    const resultado =
      await mpResponse.json();

    if (!mpResponse.ok) {
      console.error(
        "Mercado Pago error:",
        JSON.stringify(resultado)
      );

      return resposta({
        ok: false,

        error:
          "O Mercado Pago recusou o pagamento.",

        message:
          resultado?.message ||
          resultado?.error ||
          "Erro ao criar PIX.",

        details:
          resultado?.cause ||
          undefined
      }, mpResponse.status);
    }

    // ------------------------------------------
    // Encontrar pagamento
    // ------------------------------------------

    const payment =
      resultado?.transactions
        ?.payments?.[0];

    const paymentMethod =
      payment?.payment_method ||
      {};

    const qrCode =
      paymentMethod.qr_code ||
      paymentMethod.qr_code_base64 ||
      "";

    const qrCodeBase64 =
      paymentMethod.qr_code_base64 ||
      "";

    const ticketUrl =
      paymentMethod.ticket_url ||
      "";

    // ------------------------------------------
    // Resposta segura para o frontend
    // ------------------------------------------

    return resposta({
      ok: true,

      orderId:
        resultado.id ||
        null,

      status:
        resultado.status ||
        payment?.status ||
        "action_required",

      statusDetail:
        resultado.status_detail ||
        payment?.status_detail ||
        "waiting_transfer",

      paymentId:
        payment?.id ||
        null,

      amount:
        total.toFixed(2),

      qrCode,

      qrCodeBase64,

      ticketUrl,

      externalReference:
        externalReference
    });

  } catch (erro) {
    console.error(
      "Erro criar PIX:",
      erro
    );

    return resposta({
      ok: false,

      error:
        erro?.message ||
        "Erro interno ao criar pagamento PIX."
    }, 500);
  }
}


// ======================================================
// MERCADO PAGO - CONSULTAR ORDER
// ======================================================

async function consultarPagamento(
  orderId,
  env
) {
  try {
    if (!env.MERCADOPAGO_ACCESS_TOKEN) {
      return resposta({
        ok: false,
        error:
          "MERCADOPAGO_ACCESS_TOKEN não configurado."
      }, 500);
    }

    const mpResponse =
      await fetch(
        `https://api.mercadopago.com/v1/orders/${encodeURIComponent(orderId)}`,
        {
          method: "GET",

          headers: {
            "Authorization":
              `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}`,

            "Accept":
              "application/json"
          }
        }
      );

    const resultado =
      await mpResponse.json();

    if (!mpResponse.ok) {
      return resposta({
        ok: false,

        error:
          "Não foi possível consultar o pedido.",

        message:
          resultado?.message ||
          resultado?.error ||
          "Erro Mercado Pago."
      }, mpResponse.status);
    }

    const payment =
      resultado?.transactions
        ?.payments?.[0];

    return resposta({
      ok: true,

      orderId:
        resultado.id ||
        orderId,

      status:
        resultado.status ||
        payment?.status ||
        null,

      statusDetail:
        resultado.status_detail ||
        payment?.status_detail ||
        null,

      paymentId:
        payment?.id ||
        null
    });

  } catch (erro) {
    return resposta({
      ok: false,

      error:
        erro?.message ||
        "Erro ao consultar pagamento."
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
          "no-store",

        "Access-Control-Allow-Origin":
          "*"
      }
    }
  );
}
