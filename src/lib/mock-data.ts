export type Lesson = {
  id: string;
  title: string;
  isExam?: boolean;
  resources: {
    livroDigital?: string;
    wordwall?: string;
    kahoot?: string;
    pdf?: string;
    video?: string;
    observacoes?: string;
  };
};

export type CourseModule = {
  id: string;
  title: string;
  lessons: Lesson[];
};

export type Course = {
  id: string;
  title: string;
  description: string;
  color: string; // css var name segment
  modules: CourseModule[];
};

const emptyRes = {
  livroDigital: "https://escoladiscover.com.br/",
  wordwall: "https://wordwall.net/",
  kahoot: "https://kahoot.com/",
  pdf: "https://escoladiscover.com.br/",
  video: "https://youtube.com/",
  observacoes: "Reforçar conceitos abordados em aula.",
};

function makeLessons(n: number): Lesson[] {
  const out: Lesson[] = [];
  for (let i = 1; i <= n; i++) {
    const isExam = i === n;
    out.push({
      id: `aula-${i}`,
      title: isExam ? `Aula ${i} (Prova)` : `Aula ${i}`,
      isExam,
      resources: emptyRes,
    });
  }
  return out;
}

export const COURSES: Course[] = [
  {
    id: "informatica",
    title: "Informática",
    description: "Fundamentos de Windows, Word, Excel e PowerPoint.",
    color: "primary",
    modules: [
      { id: "windows", title: "Windows", lessons: makeLessons(5) },
      { id: "word", title: "Word", lessons: makeLessons(9) },
      { id: "excel", title: "Excel", lessons: makeLessons(10) },
      { id: "powerpoint", title: "PowerPoint", lessons: makeLessons(7) },
    ],
  },
  {
    id: "robotica-1",
    title: "Robótica Ano 1",
    description: "Introdução à robótica educacional.",
    color: "accent",
    modules: [
      { id: "intro", title: "Introdução", lessons: makeLessons(6) },
      { id: "sensores", title: "Sensores", lessons: makeLessons(8) },
      { id: "motores", title: "Motores e Movimento", lessons: makeLessons(7) },
    ],
  },
  {
    id: "robotica-2",
    title: "Robótica Ano 2",
    description: "Projetos avançados e programação de robôs.",
    color: "accent",
    modules: [
      { id: "programacao", title: "Programação Avançada", lessons: makeLessons(9) },
      { id: "projetos", title: "Projetos Práticos", lessons: makeLessons(10) },
    ],
  },
  {
    id: "games-1",
    title: "Criação de Games 1",
    description: "Primeiros passos na criação de jogos digitais.",
    color: "primary",
    modules: [
      { id: "scratch", title: "Scratch", lessons: makeLessons(8) },
      { id: "roblox", title: "Roblox Studio", lessons: makeLessons(9) },
    ],
  },
  {
    id: "games-2",
    title: "Criação de Games 2",
    description: "Aprofundamento em desenvolvimento de jogos.",
    color: "primary",
    modules: [
      { id: "unity", title: "Unity", lessons: makeLessons(10) },
      { id: "publicacao", title: "Publicação e Design", lessons: makeLessons(6) },
    ],
  },
];

export function findCourse(id: string) {
  return COURSES.find((c) => c.id === id);
}

export type Aluno = { id: string; nome: string };
export type Turma = {
  id: string;
  nome: string;
  cursoId: string;
  professor: string;
  ano: number;
  alunos: Aluno[];
};

const nomes = [
  "Ana Beatriz Silva",
  "Bruno Oliveira",
  "Carla Mendes",
  "Daniel Rocha",
  "Eduarda Lima",
  "Felipe Costa",
  "Gabriela Souza",
  "Henrique Alves",
  "Isabela Ferreira",
  "João Pedro Martins",
  "Larissa Nunes",
  "Matheus Ribeiro",
];

export const TURMAS: Turma[] = [
  {
    id: "turma-a",
    nome: "Turma A - Manhã",
    cursoId: "informatica",
    professor: "Prof. Marcos Andrade",
    ano: 2026,
    alunos: nomes.slice(0, 10).map((n, i) => ({ id: `a-${i}`, nome: n })),
  },
  {
    id: "turma-b",
    nome: "Turma B - Tarde",
    cursoId: "robotica-1",
    professor: "Prof. Marcos Andrade",
    ano: 2026,
    alunos: nomes.slice(0, 8).map((n, i) => ({ id: `b-${i}`, nome: n })),
  },
  {
    id: "turma-c",
    nome: "Turma C - Sábado",
    cursoId: "games-1",
    professor: "Prof. Marcos Andrade",
    ano: 2026,
    alunos: nomes.slice(2, 12).map((n, i) => ({ id: `c-${i}`, nome: n })),
  },
];

export function findTurma(id: string) {
  return TURMAS.find((t) => t.id === id);
}