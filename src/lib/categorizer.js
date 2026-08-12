// Categorização local de itens de compra — sem IA/API.
// 6 categorias orientadas por missão de compra (ICP: organizador de viagem em grupo).

const CATEGORIAS = {
  dispensa: [
    'arroz', 'massa', 'esparguete', 'macarrao', 'macarrão', 'açucar', 'açúcar', 'acucar',
    'sal', 'azeite', 'óleo', 'oleo', 'ketchup', 'mostarda', 'maionese', 'molho ingles',
    'molho', 'piri piri', 'tabasco', 'conserva', 'atum', 'sardinha', 'sardinhas',
    'feijão', 'feijao', 'grão', 'grao', 'grão-de-bico', 'grao-de-bico', 'lentilha',
    'bolacha', 'bolachas', 'farinha', 'farínha', 'café', 'cafe', 'chá', 'cha',
    'caldo', 'caldo de galinha', 'tempero', 'especiarias', 'canela', 'pimenta', 'orégãos',
    'oregaos', 'alecrim', 'curry', 'açafrão', 'baunilha', 'fermento', 'vinagre',
    'chocolate', 'cacau', 'mel', 'compota', 'doce', 'marmelada', 'amendoim', 'amendoins',
    'amêndoas', 'amendoas', 'nozes', 'frutos secos', 'passas', 'tâmaras',
    'batatas fritas', 'pipocas', 'snacks', 'bolachas', 'crackers',
    'azeite', 'óleo de girassol', 'oleo de girassol',
    'detergente', 'sabão', 'esponja', 'guardanapos', 'papel', 'papel higiénico',
    'papel higienico', 'sacos lixo', 'sacos do lixo', 'palitos', 'fósforos', 'fosforos',
    'velas', 'carvão', 'carvao', 'grelhador', 'descartáveis', 'descartaveis',
    'toalhas de mesa', 'copos de papel', 'pratos de papel',
    'sopa', 'sopa de pacote', 'massa fresca', 'pizza', 'enlatado',
    'enchidos', 'salpicão', 'presunto embalado',
  ],
  bebidas: [
    'agua', 'água', 'água com gás', 'agua com gas',
    'sumo', 'sumos', 'sumo de laranja', 'sumo de maçã',
    'refrigerante', 'refrigerantes', 'coca', 'coca-cola', 'pepsi', 'sprite', 'fanta',
    'ice tea', 'ice-tea', 'limonada', 'tónica', 'tonica',
    'vinho', 'vinho tinto', 'vinho branco', 'vinho verde', 'vinho rosé', 'rose',
    'espumante', 'champanhe', 'prosecco', 'cava',
    'cerveja', 'cervejas', 'super bock', 'sagres', 'heineken',
    'sidra', 'cidra', 'sangria',
    'licor', 'whisky', 'whiskey', 'gin', 'vodka', 'rum', 'tequila', 'brandy',
    'poncha', 'ginjinha', 'bagaço', 'medronho',
    'café', 'cafe', 'chá', 'cha', 'nespresso', 'cápsulas', 'capsulas',
    'leite condensado', 'achocolatado', 'cevada',
    'kombucha', 'isotônico', 'isotonico', 'bebida energética', 'red bull',
  ],
  talho: [
    'carne', 'carnes', 'frango', 'frango inteiro', 'peito de frango', 'coxa de frango',
    'peru', 'pato', 'coelho', 'porco', 'entrecosto', 'costeleta', 'costelas',
    'lombo', 'novilho', 'vitela', 'bife', 'bifes', 'picado', 'carne picada',
    'borrego', 'cabrito', 'leitão', 'alheira', 'morcela', 'farinheira',
    'salpicão', 'chouriço', 'chourico', 'linguiça', 'linguica',
    'presunto', 'fiambre', 'bacon', 'panceta',
    'salsicha', 'salsichas', 'hambúrguer', 'hamburguer', 'hamburger',
    'peixe', 'peixe fresco', 'bacalhau', 'bacalhau fresco', 'bacalhau seco',
    'salmão', 'salmao', 'truta', 'dourada', 'robalo', 'pargo', 'peixe espada',
    'atum fresco', 'sardinha fresca', 'cavalinha', 'carapau',
    'camarão', 'camarao', 'gamba', 'gambas', 'lagostim', 'lagosta',
    'lula', 'lulas', 'choco', 'polvo', 'mexilhão', 'mexilhao', 'amêijoa', 'ameijoa',
    'berbigão', 'berbigao', 'ostras', 'percebes', 'marisco',
    'tofu', 'seitan', 'quorn',
  ],
  laticinios: [
    'leite', 'leite magro', 'leite meio gordo', 'leite gordo',
    'iogurte', 'iogurtes', 'yogurte', 'iogurte grego', 'skyr',
    'queijo', 'queijos', 'queijo fresco', 'requeijão', 'requeijao',
    'queijo flamengo', 'queijo da ilha', 'queijo cheddar', 'mozzarella',
    'brie', 'camembert', 'emental', 'parmesão', 'parmesao', 'ricotta',
    'manteiga', 'margarina', 'natas', 'creme', 'creme de leite',
    'crème fraîche', 'creme fraiche',
    'ovos', 'ovo', 'ovos L', 'ovos M',
  ],
  fresco: [
    'fruta', 'maçã', 'maca', 'maçãs', 'macas', 'banana', 'bananas',
    'laranja', 'laranjas', 'limão', 'limao', 'lima', 'limas',
    'morango', 'morangos', 'uva', 'uvas', 'melancia', 'melão', 'melao',
    'pera', 'peras', 'pêssego', 'pessego', 'abacaxi', 'ananás', 'ananas',
    'kiwi', 'manga', 'papaia', 'figo', 'cereja', 'cerejas', 'ameixa',
    'tomate', 'tomates', 'alface', 'alfaces', 'cenoura', 'cenouras',
    'cebola', 'cebolas', 'cebola roxa', 'alho', 'alhos', 'alho francês', 'alho frances',
    'batata', 'batatas', 'batata doce', 'batatas doces',
    'legumes', 'couve', 'couve-flor', 'couve flor', 'brócolos', 'brocolos',
    'espinafre', 'espinafres', 'rúcula', 'rucula', 'agrião', 'agriao',
    'cogumelo', 'cogumelos', 'beringela', 'pepino', 'pimento', 'pimentos',
    'abóbora', 'abobora', 'courgette', 'curgete', 'milho', 'ervilha', 'ervilhas',
    'feijão verde', 'feijao verde', 'aspargo', 'aspargos',
    'salsa', 'coentros', 'hortelã', 'hortelã', 'manjericão', 'manjericao',
    'tomilho', 'alecrim fresco', 'louro', 'ervas aromáticas', 'ervas aromaticas',
    'pão', 'pao', 'broa', 'baguete', 'baguette', 'carcaça', 'carcaca',
    'pão de forma', 'pao de forma', 'papo-seco', 'croissant', 'brioche',
  ],
}

// antecipado = comprar com antecedência (sem urgência de frescura)
const ANTECIPADO_CATS = ['dispensa', 'bebidas']

// NOTE: identical normalizar() exists in mealEmoji.js — if this grows, extract to a shared lib/normalize.js
function normalizar(texto) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

function contemPalavraInteira(texto, palavra) {
  if (texto === palavra) return true
  const idx = texto.indexOf(palavra)
  if (idx === -1) return false
  const antes = idx === 0 || !/[a-z0-9]/.test(texto[idx - 1])
  const depois = idx + palavra.length >= texto.length || !/[a-z0-9]/.test(texto[idx + palavra.length])
  return antes && depois
}

function encontrarCategoria(nomeNorm) {
  // 1. Exact match across all cats (highest precision)
  for (const [cat, palavras] of Object.entries(CATEGORIAS)) {
    for (const palavra of palavras) {
      if (nomeNorm === normalizar(palavra)) return cat
    }
  }
  // 2. Word-boundary match (avoids "sal" matching "salsicha")
  for (const [cat, palavras] of Object.entries(CATEGORIAS)) {
    for (const palavra of palavras) {
      if (contemPalavraInteira(nomeNorm, normalizar(palavra))) return cat
    }
  }
  return null
}

export const CATEGORIA_PADRAO = 'outro'
export const CATEGORIAS_DISPONIVEIS = [...Object.keys(CATEGORIAS), 'outro']

export function categorizeItem(nome) {
  const nomeNorm = normalizar(nome)
  const cat = encontrarCategoria(nomeNorm)
  if (!cat) return { categoria: CATEGORIA_PADRAO, antecipado: false }
  return { categoria: cat, antecipado: ANTECIPADO_CATS.includes(cat) }
}
