# Smart Categorization para Usuários Brasileiros

Guia completo do sistema de categorização inteligente para usuários portugueses/brasileiros do Monity.

## 📋 Categorias Padrão em Português

### 💸 Categorias de Despesas (Expenses)

| Categoria | Descrição | Exemplos de Comerciantes |
|-----------|-----------|---------------------------|
| **Supermercado** | Compras de alimentos e produtos básicos | Carrefour, Extra, Pão de Açúcar, Assaí, Big |
| **Restaurante** | Refeições fora de casa | Bob's, Habib's, Domino's, restaurantes locais |
| **Transporte** | Combustível, transporte público, apps | Petrobras, Ipiranga, Ale, Uber, 99, ônibus, metrô |
| **Utilidades** | Contas básicas (luz, água, telefone) | Vivo, Tim, Claro, Oi, conta de luz, água |
| **Compras** | Produtos não essenciais | Magazine Luiza, Casas Bahia, Americanas, Mercado Livre |
| **Entretenimento** | Lazer e diversão | Netflix, Spotify, Globo Play, cinema, shows |
| **Saúde** | Gastos médicos e farmácia | Drogasil, Droga Raia, Pacheco, médicos, hospitais |
| **Alimentação** | Padarias, cafés, lanches | Padarias, cafeterias, lanchonetes |
| **Educação** | Cursos, livros, material escolar | Escolas, universidades, livrarias |
| **Casa** | Móveis, decoração, manutenção | Lojas de móveis, material de construção |
| **Roupas** | Vestuário e acessórios | Lojas de roupas, calçados |
| **Beleza** | Salões, cosméticos | Salões de beleza, perfumarias |
| **Viagem** | Turismo e hospedagem | Hotéis, passagens, agências de viagem |
| **Presente** | Presentes e mimos | Lojas de presentes, joalherias |
| **Assinatura** | Serviços mensais | Netflix, Spotify, academias |
| **Seguro** | Seguros diversos | Seguro auto, vida, residencial |
| **Imposto** | Impostos e taxas | IPTU, IPVA, IR |
| **Caridade** | Doações e ajuda | ONGs, igrejas, doações |
| **Animais** | Pets e veterinário | Pet shops, veterinários |

### 💰 Categorias de Receitas (Income)

| Categoria | Descrição | Exemplos |
|-----------|-----------|----------|
| **Salário** | Renda do trabalho | Salário mensal, décimo terceiro, férias |
| **Freelance** | Trabalhos autônomos | Projetos, consultorias, serviços |
| **Investimento** | Rendimentos financeiros | Dividendos, juros, fundos |
| **Transferência** | Transferências recebidas | PIX, TEF, transferências |
| **Presente** | Presentes em dinheiro | Aniversário, casamento |
| **Venda** | Vendas de produtos/serviços | Vendas online, produtos usados |

## 🤖 Como Funciona a IA em Português

### Reconhecimento de Comerciantes Brasileiros

A IA reconhece automaticamente centenas de comerciantes brasileiros:

**Supermercados:**
- CARREFOUR → Supermercado (90% confiança)
- EXTRA HIPERMERCADO → Supermercado (90% confiança)
- PAO DE ACUCAR → Supermercado (90% confiança)

**Transporte:**
- POSTO IPIRANGA → Transporte (90% confiança)
- UBER → Transporte (95% confiança)
- 99 → Transporte (95% confiança)

**Utilidades:**
- VIVO → Utilidades (90% confiança)
- TIM → Utilidades (90% confiança)
- CONTA DE LUZ → Utilidades (95% confiança)

### Palavras-Chave em Português

O sistema entende termos brasileiros:

| Palavra-Chave | Categoria Sugerida | Confiança |
|---------------|-------------------|-----------|
| supermercado | Supermercado | 90% |
| restaurante | Restaurante | 90% |
| gasolina | Transporte | 90% |
| farmácia | Saúde | 90% |
| cinema | Entretenimento | 90% |
| salário | Salário | 95% |

### Termos Bancários Brasileiros

A IA reconhece transações bancárias típicas do Brasil:

- **PIX** → Transferência (90% confiança)
- **TEF** → Transferência (90% confiança)
- **SAQUE** → Saque (90% confiança)
- **PGTO** → Detecta como pagamento
- **TRANSFERENCIA** → Transferência

## 🎯 Exemplos Práticos

### Descrições que a IA Entende Perfeitamente

```
CARREFOUR HIPER        → Supermercado (90%)
POSTO IPIRANGA BR116   → Transporte (90%)
FARMACIA DROGASIL      → Saúde (90%)
UBER *TRIP             → Transporte (95%)
PIX TRANSFERENCIA      → Transferência (90%)
CINEMA KINOPLEX        → Entretenimento (90%)
PAGAMENTO SALARIO      → Salário (95%)
```

### Como a IA Aprende

1. **Feedback Positivo**: Quando você aceita uma sugestão
   ```
   "PADARIA SAO BENTO" sugerido como "Alimentação" ✅
   → IA aprende que padarias = Alimentação
   ```

2. **Feedback Negativo**: Quando você corrige uma sugestão
   ```
   "MAGAZINE LUIZA" sugerido como "Compras" 
   Você muda para "Casa" 
   → IA aprende sua preferência
   ```

## 🚀 Dicas para Melhores Sugestões

### 1. Seja Específico nas Descrições

**❌ Ruim:**
```
Compra
Pagamento
Loja
```

**✅ Melhor:**
```
COMPRA CARREFOUR VILA OLIMPIA
PAGAMENTO CONTA VIVO
LOJA AMERICANAS SHOPPING
```

### 2. Use Nomes Completos de Comerciantes

**✅ Exemplos bons:**
```
POSTO SHELL BR040
FARMACIA PACHECO COPACABANA
RESTAURANTE OUTBACK BARRA
```

### 3. Inclua Contexto quando Possível

**✅ Exemplos com contexto:**
```
UBER TRIP AEROPORTO GRU
PIX TRANSFERENCIA ALUGUEL
SAQUE CAIXA ELETRONICO ITAU
```

## 📊 Níveis de Confiança

### 🟢 Alta Confiança (80-100%)
- Comerciantes conhecidos (Carrefour, Uber, Netflix)
- Termos bancários claros (PIX, TEF, Salário)
- Padrões bem estabelecidos

### 🟡 Média Confiança (60-79%)
- Palavras-chave genéricas (restaurante, farmácia)
- Comerciantes menos conhecidos
- Descrições parciais

### 🔴 Baixa Confiança (40-59%)
- Descrições ambíguas
- Comerciantes não reconhecidos
- Termos muito genéricos

## 🔄 Sistema de Aprendizado Contínuo

### Retreinamento Automático
- **Diário às 2h UTC**: Retreina com novos dados de feedback
- **A cada 6 horas**: Monitora performance e atualiza padrões
- **Semanalmente**: Limpa dados antigos e otimiza

### Melhoria Baseada em Uso
- **Primeira semana**: 60-70% de precisão
- **Após 100 transações**: 75-85% de precisão  
- **Sistema maduro**: 85-95% de precisão

## 💡 Casos Especiais Brasileiros

### Transferências PIX
```
PIX RECEBIDO JOAO SILVA     → Transferência
PIX ENVIADO MARIA SANTOS    → Transferência
PIX PAGAMENTO FREELANCE     → Freelance (se receita)
```

### Cartões de Crédito
```
PGTO CARTAO ITAU           → Banco
FATURA NUBANK              → Banco
ANUIDADE VISA              → Banco
```

### Impostos e Taxas
```
PAGAMENTO IPTU             → Imposto
TAXA IPVA                  → Imposto
MULTA DETRAN               → Transporte
```

### Supermercados Regionais
A IA aprende comerciantes locais:
```
MERCADO DO JOAO            → Após 3-5 usos → Supermercado
PADARIA NOVA ESPERANCA     → Após feedback → Alimentação
FARMACIA SANTA RITA        → Após uso → Saúde
```

## ⚙️ Configurações Recomendadas

### Para Usuários Brasileiros
1. **Linguagem**: Defina o idioma como Português
2. **Categorias**: Use as categorias padrão em português
3. **Descrições**: Sempre inclua o nome do estabelecimento
4. **Feedback**: Corrija as primeiras sugestões para ensinar a IA

### Personalização
- A IA se adapta ao seu estilo de categorização
- Aprende suas lojas favoritas
- Reconhece seus padrões de gasto únicos

## 🆘 Solução de Problemas

### Sugestões Incorretas
1. **Sempre corrija**: Isso ensina a IA
2. **Seja consistente**: Use sempre a mesma categoria para o mesmo tipo
3. **Espere algumas correções**: A IA precisa de 3-5 exemplos para aprender

### Sem Sugestões
1. **Descrição muito curta**: Use pelo menos 3 caracteres
2. **Termos muito específicos**: A IA pode não reconhecer
3. **Primeira vez**: Sistema está aprendendo seu estilo

### Sugestões Lentas
1. **Conexão**: Verifique sua internet
2. **Servidor**: Pode estar processando muitos dados
3. **Cache**: Recarregue a página

## 📈 Métricas de Sucesso

### Para Administradores
- Taxa de aceitação de sugestões
- Tempo médio de categorização
- Número de correções por usuário
- Cobertura de comerciantes brasileiros

### Para Usuários
- Menos tempo categorizando manualmente
- Maior consistência nas categorias
- Descoberta de padrões de gasto
- Análises financeiras mais precisas

---

O sistema de Smart Categorization foi projetado especificamente para funcionar perfeitamente com comerciantes brasileiros, termos bancários locais e padrões de gasto típicos do Brasil. Com o uso contínuo, torna-se cada vez mais preciso e personalizado para seu estilo de vida financeiro. 