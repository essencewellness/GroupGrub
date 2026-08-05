// Templates pré-definidos para viagens
// Premium feature — unlock com Pro (€10)

export const TEMPLATES = {
  praia: {
    name: "🏖️ Férias Praia",
    description: "Lista para destino costeiro",
    items: [
      { nome: "Guarda-sol", categoria: "duradouro", qtd: "1" },
      { nome: "Toalha de banho", categoria: "duradouro", qtd: "1" },
      { nome: "Protetor solar FPS 30", categoria: "duradouro", qtd: "1" },
      { nome: "Chinelos", categoria: "roupa", qtd: "1" },
      { nome: "Biquíni/Calamça de banho", categoria: "roupa", qtd: "2" },
      { nome: "Repelente de insetos", categoria: "duradouro", qtd: "1" },
      { nome: "Suvinil", categoria: "duradouro", qtd: "1" },
    ],
    meals: [
      { nome: "Marisco na Brasa", emoji: "🦐", tipo: "Jantar" },
      { nome: "Salada de Fruta", emoji: "🍓", tipo: "Almoço" },
      { nome: "Bifana", emoji: "🥪", tipo: "Lanche" },
    ]
  },

  montanha: {
    name: "🏔️ Férias Montanha",
    description: "Lista para casa/barragem",
    items: [
      { nome: "Mochila", categoria: "duradouro", qtd: "1" },
      { nome: "Calçado de montanha", categoria: "roupa", qtd: "1" },
      { nome: "Jaqueta impermeável", categoria: "roupa", qtd: "1" },
      { nome: "Jaqueta polar", categoria: "roupa", qtd: "1" },
      { nome: "Cobertor de campismo", categoria: "camping", qtd: "1" },
      { nome: "Lanterna", categoria: "duradouro", qtd: "1" },
      { nome: "Repelente de insetos", categoria: "duradouro", qtd: "1" },
    ],
    meals: [
      { nome: "Cozido à Portuguesa", emoji: "🍖", tipo: "Jantar" },
      { nome: "Açorda de Marisco", emoji: "🦪", tipo: "Almoço" },
      { nome: "Caldo Verde", emoji: "🥬", tipo: "Sopa" },
    ]
  },

  camping: {
    name: "⛺ Camping",
    description: "Lista para acampamento",
    items: [
      { nome: "Tenda", categoria: "camping", qtd: "1" },
      { nome: "Saco de dormir", categoria: "camping", qtd: "1" },
      { nome: "Colchão aéreo", categoria: "camping", qtd: "1" },
      { nome: "Fogareiro", categoria: "duradouro", qtd: "1" },
      { nome: "Carvão", categoria: "duradouro", qtd: "1" },
      { nome: "Espátula de camping", categoria: "camping", qtd: "1" },
      { nome: "Termo de alimentos", categoria: "duradouro", qtd: "1" },
    ],
    meals: [
      { nome: "Frango assado", emoji: "🐔", tipo: "Jantar" },
      { nome: "Arroz de marisco", emoji: "🦐", tipo: "Almoço" },
      { nome: "Grelhar misto", emoji: "🔥", tipo: "Churrasco" },
    ]
  },

  city: {
    name: "🏙️ City Break",
    description: "Lista para visita urbana",
    items: [
      { nome: "Power bank", categoria: "duradouro", qtd: "1" },
      { nome: "Carregador portátil", categoria: "duradouro", qtd: "1" },
      { nome: "Mochila de dia", categoria: "duradouro", qtd: "1" },
      { nome: "Garrafa de água", categoria: "duradouro", qtd: "1" },
      { nome: "Passapés cómodas", categoria: "roupa", qtd: "1" },
      { nome: "Guarda-chuva pequeno", categoria: "duradouro", qtd: "1" },
    ],
    meals: [
      { nome: "Bifana", emoji: "🥪", tipo: "Almoço" },
      { nome: "Pastel de Nata", emoji: "🥧", tipo: "Snack" },
      { nome: "Bacalhau à Brás", emoji: "🐟", tipo: "Jantar" },
    ]
  }
}

export const TEMPLATE_KEYS = Object.keys(TEMPLATES)
