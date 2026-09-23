export type Level = 'principiante' | 'intermedio' | 'avanzado'

export interface Course {
  id: string
  title: string
  area: string
  level: Level
  durationHours: number
  rating: number
  instructor: string
  description: string
  tags: string[]
  emoji: string
}

// F003 — Catálogo local de 5 cursos
export const COURSES: Course[] = [
  {
    id: 'py-101',
    title: 'Python desde cero',
    area: 'Programación',
    level: 'principiante',
    durationHours: 20,
    rating: 4.8,
    instructor: 'Ana Morales',
    description: 'Variables, bucles, funciones y tus primeros scripts. Ideal si nunca has programado.',
    tags: ['python', 'programación', 'lógica', 'automatización'],
    emoji: '🐍',
  },
  {
    id: 'web-react',
    title: 'Desarrollo web con React',
    area: 'Programación',
    level: 'intermedio',
    durationHours: 32,
    rating: 4.7,
    instructor: 'Luis Paredes',
    description: 'Componentes, hooks, rutas y consumo de APIs para construir aplicaciones web modernas.',
    tags: ['javascript', 'react', 'frontend', 'web'],
    emoji: '⚛️',
  },
  {
    id: 'data-ml',
    title: 'Ciencia de datos y Machine Learning',
    area: 'Datos e IA',
    level: 'avanzado',
    durationHours: 45,
    rating: 4.9,
    instructor: 'Dra. Carla Ruiz',
    description: 'Pandas, visualización, modelos supervisados y evaluación. Requiere bases de Python.',
    tags: ['datos', 'machine learning', 'ia', 'python', 'estadística'],
    emoji: '📊',
  },
  {
    id: 'ux-design',
    title: 'Diseño UX/UI para principiantes',
    area: 'Diseño',
    level: 'principiante',
    durationHours: 16,
    rating: 4.6,
    instructor: 'Sofía Andrade',
    description: 'Investigación de usuarios, wireframes y prototipos en Figma paso a paso.',
    tags: ['diseño', 'ux', 'ui', 'figma', 'prototipos'],
    emoji: '🎨',
  },
  {
    id: 'agile-scrum',
    title: 'Gestión ágil de proyectos con Scrum',
    area: 'Negocios',
    level: 'intermedio',
    durationHours: 12,
    rating: 4.5,
    instructor: 'Miguel Viejó',
    description: 'Roles, eventos y artefactos de Scrum, backlog, estimación y métricas de equipo.',
    tags: ['scrum', 'agile', 'gestión', 'proyectos', 'liderazgo'],
    emoji: '🗂️',
  },
]

export const courseById = (id: string) => COURSES.find((c) => c.id === id)
