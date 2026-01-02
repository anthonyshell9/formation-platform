import { PrismaClient, Role, CourseStatus, ContentType, QuestionType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      role: Role.ADMIN,
    },
  })

  // Create trainer
  const trainer = await prisma.user.upsert({
    where: { email: 'trainer@example.com' },
    update: {},
    create: {
      email: 'trainer@example.com',
      name: 'Jean Formateur',
      role: Role.TRAINER,
    },
  })

  // Create manager
  await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      email: 'manager@example.com',
      name: 'Marie Manager',
      role: Role.MANAGER,
    },
  })

  // Create learners
  const learner1 = await prisma.user.upsert({
    where: { email: 'learner1@example.com' },
    update: {},
    create: {
      email: 'learner1@example.com',
      name: 'Pierre Apprenant',
      role: Role.LEARNER,
    },
  })

  const learner2 = await prisma.user.upsert({
    where: { email: 'learner2@example.com' },
    update: {},
    create: {
      email: 'learner2@example.com',
      name: 'Sophie Stagiaire',
      role: Role.LEARNER,
    },
  })

  // Create groups
  const devGroup = await prisma.group.upsert({
    where: { id: 'group-dev' },
    update: {},
    create: {
      id: 'group-dev',
      name: 'Équipe Développement',
      description: 'Développeurs et ingénieurs',
      color: '#3B82F6',
    },
  })

  const salesGroup = await prisma.group.upsert({
    where: { id: 'group-sales' },
    update: {},
    create: {
      id: 'group-sales',
      name: 'Équipe Commerciale',
      description: 'Commerciaux et business developers',
      color: '#10B981',
    },
  })

  // Add members to groups
  await prisma.groupMember.upsert({
    where: { userId_groupId: { userId: learner1.id, groupId: devGroup.id } },
    update: {},
    create: {
      userId: learner1.id,
      groupId: devGroup.id,
      role: 'member',
    },
  })

  await prisma.groupMember.upsert({
    where: { userId_groupId: { userId: learner2.id, groupId: salesGroup.id } },
    update: {},
    create: {
      userId: learner2.id,
      groupId: salesGroup.id,
      role: 'member',
    },
  })

  // Create a course
  const course = await prisma.course.upsert({
    where: { slug: 'introduction-cybersecurite' },
    update: {},
    create: {
      title: 'Introduction à la Cybersécurité',
      slug: 'introduction-cybersecurite',
      description: 'Apprenez les bases de la cybersécurité et protégez votre entreprise contre les menaces.',
      status: CourseStatus.PUBLISHED,
      difficulty: 'beginner',
      category: 'Cybersécurité',
      tags: ['sécurité', 'phishing', 'mots de passe'],
      duration: 120,
      creatorId: trainer.id,
      publishedAt: new Date(),
    },
  })

  // Create modules
  const module1 = await prisma.module.upsert({
    where: { id: 'module-1' },
    update: {},
    create: {
      id: 'module-1',
      title: 'Les fondamentaux',
      description: 'Comprendre les bases de la cybersécurité',
      order: 0,
      courseId: course.id,
    },
  })

  const module2 = await prisma.module.upsert({
    where: { id: 'module-2' },
    update: {},
    create: {
      id: 'module-2',
      title: 'Reconnaître les menaces',
      description: 'Identifier les différents types de cyberattaques',
      order: 1,
      courseId: course.id,
    },
  })

  // Create lessons
  await prisma.lesson.upsert({
    where: { id: 'lesson-1' },
    update: {},
    create: {
      id: 'lesson-1',
      title: 'Qu\'est-ce que la cybersécurité ?',
      description: 'Introduction aux concepts de base',
      contentType: ContentType.TEXT,
      content: `
# Introduction à la cybersécurité

La cybersécurité est l'ensemble des moyens techniques, organisationnels, juridiques et humains nécessaires à la mise en place de moyens visant à empêcher l'utilisation non autorisée, le mauvais usage, la modification ou le détournement du système d'information.

## Pourquoi est-ce important ?

- Protection des données sensibles
- Conformité réglementaire (RGPD, etc.)
- Continuité des activités
- Réputation de l'entreprise

## Les piliers de la cybersécurité

1. **Confidentialité** : Seules les personnes autorisées peuvent accéder aux informations
2. **Intégrité** : Les informations ne sont pas modifiées de manière non autorisée
3. **Disponibilité** : Les informations sont accessibles quand on en a besoin
      `,
      order: 0,
      moduleId: module1.id,
    },
  })

  await prisma.lesson.upsert({
    where: { id: 'lesson-2' },
    update: {},
    create: {
      id: 'lesson-2',
      title: 'Les mots de passe sécurisés',
      description: 'Comment créer et gérer des mots de passe robustes',
      contentType: ContentType.TEXT,
      content: `
# Les mots de passe sécurisés

Un mot de passe fort est votre première ligne de défense contre les intrusions.

## Règles d'or

- Minimum 12 caractères
- Mélange de majuscules, minuscules, chiffres et caractères spéciaux
- Pas de mots du dictionnaire
- Un mot de passe unique par service

## Gestionnaires de mots de passe

Utilisez un gestionnaire de mots de passe pour :
- Générer des mots de passe complexes
- Les stocker de manière sécurisée
- Les synchroniser entre vos appareils
      `,
      order: 1,
      moduleId: module1.id,
    },
  })

  await prisma.lesson.upsert({
    where: { id: 'lesson-3' },
    update: {},
    create: {
      id: 'lesson-3',
      title: 'Le phishing expliqué',
      description: 'Comprendre et reconnaître les tentatives de phishing',
      contentType: ContentType.TEXT,
      content: `
# Le phishing

Le phishing (hameçonnage) est une technique utilisée par les cybercriminels pour voler vos informations personnelles.

## Comment ça fonctionne ?

1. Vous recevez un email qui semble légitime
2. Le message vous incite à cliquer sur un lien
3. Vous êtes redirigé vers un faux site
4. Vos identifiants sont volés

## Comment se protéger ?

- Vérifiez l'expéditeur
- Ne cliquez pas sur les liens suspects
- Vérifiez l'URL dans la barre d'adresse
- En cas de doute, contactez directement l'entreprise
      `,
      order: 0,
      moduleId: module2.id,
    },
  })

  // Create a quiz
  const quiz = await prisma.quiz.upsert({
    where: { id: 'quiz-1' },
    update: {},
    create: {
      id: 'quiz-1',
      title: 'Quiz - Les bases de la cybersécurité',
      description: 'Testez vos connaissances sur les fondamentaux de la cybersécurité',
      timeLimit: 10,
      passingScore: 70,
      shuffleQuestions: true,
      showCorrectAnswers: true,
      creatorId: trainer.id,
    },
  })

  // Create questions
  const question1 = await prisma.question.upsert({
    where: { id: 'question-1' },
    update: {},
    create: {
      id: 'question-1',
      quizId: quiz.id,
      type: QuestionType.SINGLE_CHOICE,
      question: 'Quelle est la longueur minimale recommandée pour un mot de passe ?',
      points: 1,
      order: 0,
    },
  })

  await prisma.option.createMany({
    data: [
      { questionId: question1.id, text: '6 caractères', isCorrect: false, order: 0 },
      { questionId: question1.id, text: '8 caractères', isCorrect: false, order: 1 },
      { questionId: question1.id, text: '12 caractères', isCorrect: true, order: 2 },
      { questionId: question1.id, text: '4 caractères', isCorrect: false, order: 3 },
    ],
    skipDuplicates: true,
  })

  const question2 = await prisma.question.upsert({
    where: { id: 'question-2' },
    update: {},
    create: {
      id: 'question-2',
      quizId: quiz.id,
      type: QuestionType.TRUE_FALSE,
      question: 'Le phishing ne peut être effectué que par email.',
      explanation: 'Le phishing peut aussi se faire par SMS (smishing), téléphone (vishing) ou réseaux sociaux.',
      points: 1,
      order: 1,
    },
  })

  await prisma.option.createMany({
    data: [
      { questionId: question2.id, text: 'Vrai', isCorrect: false, order: 0 },
      { questionId: question2.id, text: 'Faux', isCorrect: true, order: 1 },
    ],
    skipDuplicates: true,
  })

  const question3 = await prisma.question.upsert({
    where: { id: 'question-3' },
    update: {},
    create: {
      id: 'question-3',
      quizId: quiz.id,
      type: QuestionType.MULTIPLE_CHOICE,
      question: 'Quels sont les piliers de la cybersécurité ? (Plusieurs réponses possibles)',
      points: 2,
      order: 2,
    },
  })

  await prisma.option.createMany({
    data: [
      { questionId: question3.id, text: 'Confidentialité', isCorrect: true, order: 0 },
      { questionId: question3.id, text: 'Intégrité', isCorrect: true, order: 1 },
      { questionId: question3.id, text: 'Disponibilité', isCorrect: true, order: 2 },
      { questionId: question3.id, text: 'Rapidité', isCorrect: false, order: 3 },
    ],
    skipDuplicates: true,
  })

  // Create badges
  await prisma.badge.upsert({
    where: { id: 'badge-first-course' },
    update: { isActive: true },
    create: {
      id: 'badge-first-course',
      name: 'Première formation',
      description: 'Terminer sa première formation',
      imageUrl: '/badges/first-course.svg',
      points: 10,
      category: 'Progression',
      isActive: true,
    },
  })

  await prisma.badge.upsert({
    where: { id: 'badge-quiz-master' },
    update: { isActive: true },
    create: {
      id: 'badge-quiz-master',
      name: 'Maître des quiz',
      description: 'Réussir 10 quiz avec plus de 80%',
      imageUrl: '/badges/quiz-master.svg',
      points: 50,
      category: 'Quiz',
      isActive: true,
    },
  })

  await prisma.badge.upsert({
    where: { id: 'badge-cyber-aware' },
    update: { isActive: true },
    create: {
      id: 'badge-cyber-aware',
      name: 'Cyber-conscient',
      description: 'Terminer toutes les formations de cybersécurité',
      imageUrl: '/badges/cyber-aware.svg',
      points: 100,
      category: 'Cybersécurité',
      isActive: true,
    },
  })

  // More default badges for common achievements
  await prisma.badge.upsert({
    where: { id: 'badge-perfect-score' },
    update: { isActive: true },
    create: {
      id: 'badge-perfect-score',
      name: 'Score parfait',
      description: 'Obtenir 100% à un quiz',
      imageUrl: '/badges/perfect-score.svg',
      points: 25,
      category: 'Quiz',
      isActive: true,
    },
  })

  await prisma.badge.upsert({
    where: { id: 'badge-fast-learner' },
    update: { isActive: true },
    create: {
      id: 'badge-fast-learner',
      name: 'Apprenant rapide',
      description: 'Terminer une formation en moins de 24h',
      imageUrl: '/badges/fast-learner.svg',
      points: 30,
      category: 'Progression',
      isActive: true,
    },
  })

  await prisma.badge.upsert({
    where: { id: 'badge-dedication' },
    update: { isActive: true },
    create: {
      id: 'badge-dedication',
      name: 'Dédication',
      description: 'Se connecter 7 jours consécutifs',
      imageUrl: '/badges/dedication.svg',
      points: 20,
      category: 'Engagement',
      isActive: true,
    },
  })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
