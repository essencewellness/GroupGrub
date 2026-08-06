// Utilitário de Categorização Inteligente Local (sem IA/API externa).
// Dicionário de palavras-chave em Português — correspondência por substring
// após normalização (minúsculas + remoção de acentos).

const CATEGORIAS = {
  duradouro: [
    'arroz', 'massa', 'esparguete', 'macarrao', 'macarrão', 'açucar', 'açúcar', 'acucar',
    'sal', 'azeite', 'óleo', 'oleo', 'azeite', 'ketchup', 'mostarda', 'maionese', 'molho',
    'conserva', 'atum', 'sardinha', 'sardínhas', 'sardinhas', 'sardinha', 'feijão', 'feijao',
    'grão', 'grao', 'grão-de-bico', 'grao-de-bico', 'grao de bico', 'lentilha', 'lentilhas',
    'bolacha', 'bolachas', 'bolachas', 'farínha', 'farinha', 'café', 'cafe', 'chá', 'cha',
    'agua', 'água', 'sumo', 'sumos', 'refrigerante', 'refrigerantes', 'vinho', 'cerveja',
    'cervejas', 'licor', 'whisky', 'gin', 'vodka', 'rum', 'espumante', 'sidra', 'carvão',
    'carvao', 'grelhador', 'guardanapos', 'papel higiénico', 'papel higienico', 'papel',
    'detergente', 'amaciante', 'esponja', 'sacos do lixo', 'sacos lixo', 'palitos', 'fosforos',
    'fósforos', 'velas', 'açucar', 'mel', 'compota', 'doces', 'chocolate', 'nozes', 'amendoins',
    'amêndoas', 'amendoas', 'frutos secos', 'enlatado', 'enchidos', 'batatas fritas',
    'pipocas', 'acionar', 'tempero', 'especiarias', 'canela', 'pimenta', 'orégãos', 'oregaos',
    'alecrim', 'curry', 'açafrão', 'acafrao', 'baunilha', 'fermento', 'sopa', 'caldo',
  ],
  fresco: [
    'fruta', 'maçã', 'maca', 'maçãs', 'macas', 'banana', 'bananas', 'laranja', 'laranjas',
    'laranja', 'limão', 'limao', 'lima', 'limas', 'morango', 'morangos', 'uva', 'uvas',
    'melancia', 'melancias', 'melão', 'melao', 'melaos', 'pera', 'peras', 'pêra', 'peras',
    'pessego', 'pêssego', 'pessegos', 'abacaxi', 'kiwi', 'kiwis', 'pêssego', 'nectarina',
    'tomate', 'tomates', 'alface', 'cenoura', 'cenouras', 'cebola', 'cebolas', 'alho',
    'batata', 'batatas', 'batata doce', 'legumes', 'legume', 'couve', 'brócolos', 'brocolos',
    'broculos', 'espinafre', 'ervas aromáticas', 'ervas aromaticas', 'coentros', 'salsa',
    'cogumelo', 'cogumelos', 'berinjela', 'beringela', 'pepino', 'pimento', 'pimentos',
    'abóbora', 'abobora', 'rabanete', 'nabo', 'nabos', 'beterraba', 'alcachofra', 'aspargos',
    'rucula', 'rúcula', 'rucula', 'agrião', 'agriao', 'milho', 'ervilha', 'ervilhas',
    'feijão verde', 'feijao verde', 'pão', 'pao', 'broa', 'fruta seca', 'tâmara', 'tamara',
    'figo', 'figos', 'uva passa', 'ginseng',
  ],
  refrigerado: [
    'leite', 'leites', 'iogurte', 'iogurtes', 'yogurte', 'queijo', 'queijos', 'requeijão',
    'requeijao', 'manteiga', 'natas', 'creme', 'creme culinário', 'fiambre', 'fiambres',
    'presunto', 'enchido', 'chouriço', 'chourico', 'linguiça', 'linguica', 'salsicha',
    'salsichas', 'bacon', 'bacon', 'carne', 'carnes', 'frango', 'peru', 'porco', 'novilho',
    'vitela', 'alheira', 'morcela', 'farinheira', 'chamuça', 'cachorro', 'hamburger',
    'hambúrguer', 'hamburguer', 'bacalhau fresco', 'bacalhau', 'salmão', 'salmao', 'truta',
    'paredes', 'ovos', 'ovo', 'manteiga', 'requesão', 'requesao', 'tofu', 'seitan',
    'iogurte grego', 'queijo fresco', 'massa fresca', 'massa quebrada', 'pizza fresca',
  ],
  congelado: [
    'gelo', 'gelado', 'gelados', 'sorvete', 'sorbete', 'pizza congelada', 'pizza', 'nuggets',
    'hambúrguer congelado', 'hamburguer congelado', 'hambúrguer', 'hamburguer', 'ervilhas congeladas',
    'ervilha congelada', 'peixe congelado', 'peixe', 'camarão', 'camarao', 'gamba', 'lulas',
    'polvo', 'lagosta', 'bacalhau congelado', 'batata palha', 'batata frita congelada', 'espinafre congelado',
  ],
}

// Palavras que forçam antecipado=true mesmo em categorias mistas
const ANTECIPADO_EXTRA = ['congelado', 'congelada', 'duradouro', 'enlatado', 'conserva', 'carvão', 'carvao']

function normalizar(texto) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .trim()
}

// Devolve a categoria correspondente ou null
function encontrarCategoria(nomeNorm) {
  for (const [cat, palavras] of Object.entries(CATEGORIAS)) {
    for (const palavra of palavras) {
      if (nomeNorm.includes(palavra)) return cat
    }
  }
  return null
}

/**
 * Categoriza um item de compra com base no dicionário local.
 * @param {string} nome - nome do item (ex: "Atum em conserva")
 * @returns {{ categoria: string, antecipado: boolean }}
 *  - devolve uma categoria conhecida (duradouro/fresco/congelado/refrigerado) quando houver match;
 *  - caso contrário devolve categoria 'desconhecido' (não categorizado → item preca de atenção manual).
 */
export const UNCATEGORIZED = 'desconhecido'

export function categorizeItem(nome) {
  const nomeNorm = normalizar(nome)
  const cat = encontrarCategoria(nomeNorm)

  if (!cat) {
    return { categoria: UNCATEGORIZED, antecipado: false }
  }

  // duradouro e congelado são, por defeito, comprados com antecedência
  const antecipado = cat === 'duradouro' || cat === 'congelado' || ANTECIPADO_EXTRA.some(p => nomeNorm.includes(p))

  return { categoria: cat, antecipado }
}

export const CATEGORIAS_DISPONIVEIS = Object.keys(CATEGORIAS)
