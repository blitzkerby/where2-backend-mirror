// const { sequelize, HealthArticle } = require("./../model")

// const healthArticlesData = [
//     {
//       title: "Die Rolle der Ernährung in der mentalen Gesundheit",
//       description: "Erfahren Sie, wie Ihre Ernährung Ihre geistige Gesundheit beeinflussen kann und welche Nahrungsmittel besonders vorteilhaft sind.",
//       content: "Eine ausgewogene Ernährung kann das Risiko von Depressionen und Angstzuständen reduzieren. Bestimmte Nährstoffe sind entscheidend für die Gehirnfunktion.",
//       image: "https://images.unsplash.com/photo-1582719470726-107d66e3c5b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxMTc3M3wwfDF8c2VhcmNofDJ8fGhlYWx0aHxlbnwwfHx8fDE2MzM1MTMwMDg&ixlib=rb-1.2.1&q=80&w=400",
//       author: "Dr. Anna Müller",
//       date: new Date(), // Current date
//       isPublished: true,
//     },
//     {
//       title: "Stressbewältigung: Techniken für den Alltag",
//       description: "Entdecken Sie effektive Methoden zur Stressbewältigung, die Sie leicht in Ihren Alltag integrieren können.",
//       content: "Techniken wie Meditation, Yoga und regelmäßige Bewegung sind einfache Möglichkeiten, um Stress abzubauen und das Wohlbefinden zu steigern.",
//       image: "https://images.unsplash.com/photo-1524714203496-1b0a1b3a9bb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxMTc3M3wwfDF8c2VhcmNofDR8fGhlYWx0aHxlbnwwfHx8fDE2MzM1MTMwODg&ixlib=rb-1.2.1&q=80&w=400",
//       author: "Markus Schmidt",
//       date: new Date(), // Current date
//       isPublished: true,
//     },
//     {
//       title: "Die Vorteile von Yoga für die mentale Gesundheit",
//       description: "Erfahren Sie, wie Yoga helfen kann, Stress abzubauen und das allgemeine Wohlbefinden zu steigern.",
//       content: "Yoga kombiniert körperliche Bewegung mit Atemtechniken, was zu einer verbesserten geistigen Klarheit und emotionalen Stabilität führt.",
//       image: "https://images.unsplash.com/photo-1585391350671-bf11e8c52f52?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxMTc3M3wwfDF8c2VhcmNofDN8fGhlYWx0aHxlbnwwfHx8fDE2MzM1MTMxMjE&ixlib=rb-1.2.1&q=80&w=400",
//       author: "Julia Fischer",
//       date: new Date(), // Current date
//       isPublished: true,
//     },
//     {
//       title: "Wie Schlaf Ihre Gesundheit beeinflusst",
//       description: "Schlaf ist entscheidend für Ihre geistige Gesundheit. Hier sind Tipps, um besser zu schlafen.",
//       content: "Eine gute Schlafhygiene ist wichtig. Achten Sie auf regelmäßige Schlafenszeiten und eine angenehme Schlafumgebung.",
//       image: "https://images.unsplash.com/photo-1579532071627-cbf6470f3420?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxMTc3M3wwfDF8c2VhcmNofDIwfHxjb21wbGljYXRpb258ZW58MHx8fHwxNjMzNTEzMTQw&ixlib=rb-1.2.1&q=80&w=400",
//       author: "Dr. Lisa Weber",
//       date: new Date(), // Current date
//       isPublished: true,
//     },
//     {
//       title: "Die Auswirkungen von sozialer Isolation auf die Psyche",
//       description: "Soziale Isolation kann ernsthafte Auswirkungen auf die mentale Gesundheit haben. Lernen Sie, wie Sie sich sozial vernetzen können.",
//       content: "Es ist wichtig, soziale Kontakte zu pflegen, auch wenn es virtuell ist. Verbindungen zu anderen Menschen sind entscheidend für unser Wohlbefinden.",
//       image: "https://images.unsplash.com/photo-1595152772831-4c3bcaa10e09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxMTc3M3wwfDF8c2VhcmNofDEzfHxpbW1hbml0aWV8ZW58MHx8fHwxNjMzNTEzMTk3&ixlib=rb-1.2.1&q=80&w=400",
//       author: "Anna Lange",
//       date: new Date(), // Current date
//       isPublished: true,
//     },
//   ];

//   const seedHealthArticles = async () => {
//     try {
//       await sequelize.authenticate(); // Ensure the database connection is established
//       await HealthArticle.bulkCreate(healthArticlesData);
//       console.log('Health articles seeded successfully!');
//     } catch (error) {
//       console.error('Error seeding health articles:', error);
//     }
//   };
  
//   // Call the function to seed articles
//   seedHealthArticles();