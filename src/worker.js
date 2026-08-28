export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/frete" && request.method === "POST") {
      return calcularFrete(request, env);
    }

    return new Response("AURÉA Worker funcionando.", {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=UTF-8"
      }
    });
  }
};

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
        details: resultado
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

function resposta(dados, status = 200) {
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
