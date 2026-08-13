// Auto-selects an emoji based on meal name keywords.
// Returns the best-match emoji or null if no match found.

const EMOJI_MAP = [
  { emoji: '🍝', words: ['lasanha', 'lasagna', 'massa', 'esparguete', 'carbonara', 'bolonhesa', 'penne', 'tagliatelle', 'linguine', 'cannelloni'] },
  { emoji: '🔥', words: ['churrasco', 'grelhado', 'grelhada', 'grelhados', 'brasa', 'fogueira', 'espetada', 'espeto'] },
  { emoji: '🥩', words: ['bife', 'bifes', 'novilho', 'vitela', 'entrecosto', 'picanha', 'costeleta', 'costelas', 'lombo', 'secretos', 'pluma'] },
  { emoji: '🍗', words: ['frango', 'galinha', 'pato', 'peru', 'coelho', 'aves', 'pintada'] },
  { emoji: '🐟', words: ['peixe', 'bacalhau', 'salmão', 'salmao', 'truta', 'dourada', 'robalo', 'sardinha', 'atum', 'carapau', 'pargo'] },
  { emoji: '🦐', words: ['camarão', 'camarao', 'gambas', 'lagostim', 'lagosta', 'marisco', 'lulas', 'polvo', 'choco', 'mexilhão'] },
  { emoji: '🫕', words: ['cozido', 'caldeirada', 'feijoada', 'rancho', 'ensopado', 'guisado', 'estufado', 'jardineira'] },
  { emoji: '🍲', words: ['sopa', 'caldo', 'creme de', 'açorda', 'gaspacho', 'potage'] },
  { emoji: '🥗', words: ['salada', 'cesar', 'nicoise', 'coleslaw', 'taboulé'] },
  { emoji: '🍳', words: ['ovos', 'ovo', 'mexidos', 'estrelados', 'cozidos', 'omelete', 'omeleta', 'tortilha', 'quiche', 'frittata'] },
  { emoji: '🥘', words: ['paella', 'arroz de', 'arroz', 'risotto', 'risoto'] },
  { emoji: '🍕', words: ['pizza'] },
  { emoji: '🍔', words: ['hamburguer', 'hambúrguer', 'burger', 'smash'] },
  { emoji: '🌮', words: ['tacos', 'taco', 'burrito', 'wrap', 'nachos', 'fajita'] },
  { emoji: '🥙', words: ['pita', 'kebab', 'shawarma', 'falafel'] },
  { emoji: '🫙', words: ['petisco', 'petiscos', 'acepipes', 'tapas', 'entrada', 'entradas', 'tábua', 'tabua'] },
  { emoji: '🍖', words: ['leitão', 'leitao', 'porco', 'borrego', 'cabrito', 'javali', 'rabo de boi'] },
  { emoji: '🥓', words: ['bacon', 'panceta', 'enchidos', 'chouriço', 'alheira', 'morcela', 'farinheira'] },
  { emoji: '🍰', words: ['bolo', 'tarte', 'torta', 'cheesecake', 'brownie', 'muffin', 'cupcake', 'pao de lo', 'pão de ló'] },
  { emoji: '🍮', words: ['pudim', 'mousse', 'panna cotta', 'tiramisu', 'leite creme', 'arroz doce', 'aletria', 'doce', 'sobremesa'] },
  { emoji: '🥐', words: ['croissant', 'tostas', 'torradas', 'pequeno-almoço', 'pequeno almoco', 'brunch'] },
  { emoji: '🥤', words: ['cocktail', 'cocktails', 'bebidas', 'sangria', 'poncha', 'caipirinha'] },
  { emoji: '🫔', words: ['crepe', 'crepes', 'panqueca', 'panquecas', 'waffle', 'waffles'] },
  { emoji: '🥞', words: ['panqueca', 'hotcakes'] },
  { emoji: '🍱', words: ['sushi', 'sashimi', 'maki', 'niguiri', 'ramen', 'wok', 'yakissoba'] },
  { emoji: '🌯', words: ['sandwich', 'sandwiche', 'sandwishes', 'sandes', 'prego', 'bifana', 'francesinha'] },
]

// NOTE: identical normalizar() exists in categorizer.js — if this grows, extract to a shared lib/normalize.js
function normalizar(texto) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

export function suggestEmoji(nome) {
  const n = normalizar(nome)
  if (!n || n.length < 2) return null
  for (const { emoji, words } of EMOJI_MAP) {
    for (const word of words) {
      if (n.includes(normalizar(word))) return emoji
    }
  }
  return null
}
