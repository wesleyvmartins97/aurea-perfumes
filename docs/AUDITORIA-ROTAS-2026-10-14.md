# Auditoria de rotas VALENZA — 14/10/2026

Preparação isolada, sem publicação.

- `detail(id)`: rota de perfume já presente.
- `openCart()` usa URL anterior; necessita `/carrinho/` e reload funcional.
- `openCheckout()` usa URL anterior; necessita `/checkout/` sem exposição de dados de pagamento.
- `popstate` precisa restaurar overlays ao voltar do checkout.
- Páginas transacionais não podem ser indexadas.
- Preservar checkout, dados pessoais, preços, estoque, carrinho e layout.
