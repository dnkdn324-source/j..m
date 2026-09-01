import { Category } from './types';

const mkPair = (id: string, word: string, clue: string) => ({ id, word, clue });

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'animales',
    name: 'ANIMALES',
    unlocked: true,
    words: [
      mkPair('a1', 'Perro', 'Ladrido'),
      mkPair('a2', 'Gato', 'Bola de pelo'),
      mkPair('a3', 'Elefante', 'Colmillo'),
      mkPair('a4', 'Delfín', 'Aleta'),
      mkPair('a5', 'Serpiente', 'Cascabel'),
      mkPair('a6', 'León', 'Crin'),
      mkPair('a7', 'Pingüino', 'Antártico'),
      mkPair('a8', 'Mariposa', 'Crisálida'),
    ],
  },
  {
    id: 'comida',
    name: 'COMIDA',
    unlocked: true,
    words: [
      mkPair('c1', 'Cebolla', 'Lágrima'),
      mkPair('c2', 'Pizza', 'Mozzarella'),
      mkPair('c3', 'Chocolate', 'Cacao'),
      mkPair('c4', 'Limón', 'Vitamina C'),
      mkPair('c5', 'Arroz', 'Grano'),
      mkPair('c6', 'Hamburguesa', 'Ketchup'),
      mkPair('c7', 'Helado', 'Cucurucho'),
      mkPair('c8', 'Café', 'Cafeína'),
    ],
  },
  {
    id: 'lugares',
    name: 'LUGARES',
    unlocked: true,
    words: [
      mkPair('l1', 'Playa', 'Bronceado'),
      mkPair('l2', 'Montaña', 'Altitud'),
      mkPair('l3', 'Ciudad', 'Semáforo'),
      mkPair('l4', 'Bosque', 'Musgo'),
      mkPair('l5', 'Desierto', 'Espejismo'),
      mkPair('l6', 'Cueva', 'Murciélago'),
      mkPair('l7', 'Volcán', 'Erupción'),
      mkPair('l8', 'Glaciar', 'Deshielo'),
    ],
  },
  {
    id: 'objetos',
    name: 'OBJETOS',
    unlocked: true,
    words: [
      mkPair('o1', 'Tijeras', 'Filo'),
      mkPair('o2', 'Espejo', 'Reflejo'),
      mkPair('o3', 'Llave', 'Cerradura'),
      mkPair('o4', 'Reloj', 'Manecilla'),
      mkPair('o5', 'Libro', 'Capítulo'),
      mkPair('o6', 'Brújula', 'Norte'),
      mkPair('o7', 'Linterna', 'Pila'),
      mkPair('o8', 'Paraguas', 'Varilla'),
    ],
  },
  {
    id: 'profesiones',
    name: 'PROFESIONES',
    unlocked: true,
    words: [
      mkPair('p1', 'Doctor', 'Fonendoscopio'),
      mkPair('p2', 'Maestro', 'Tiza'),
      mkPair('p3', 'Chef', 'Delantal'),
      mkPair('p4', 'Piloto', 'Carlinga'),
      mkPair('p5', 'Bombero', 'Manguera'),
      mkPair('p6', 'Detective', 'Lupa'),
      mkPair('p7', 'Astronauta', 'Cápsula'),
      mkPair('p8', 'Jardinero', 'Rastrillo'),
    ],
  },
  {
    id: 'deportes',
    name: 'DEPORTES',
    unlocked: true,
    words: [
      mkPair('d1', 'Fútbol', 'Córner'),
      mkPair('d2', 'Natación', 'Cloro'),
      mkPair('d3', 'Tenis', 'Deuce'),
      mkPair('d4', 'Boxeo', 'Nocaut'),
      mkPair('d5', 'Ciclismo', 'Pedaleo'),
      mkPair('d6', 'Escalada', 'Mosquetón'),
      mkPair('d7', 'Surf', 'Tabla'),
      mkPair('d8', 'Ajedrez', 'Jaque'),
    ],
  },
];

export const AVATAR_COLORS = [
  '#4ADE80', '#F472B6', '#60A5FA', '#FBBF24',
  '#F87171', '#A78BFA', '#34D399', '#FB923C',
  '#38BDF8', '#E879F9', '#86EFAC', '#FCD34D',
];
