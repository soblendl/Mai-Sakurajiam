import { styleText, formatNumber } from '../lib/utils.js';

// Base de preguntas de trivia (100+ preguntas)
const triviaQuestions = [
    // Ciencia
    { pregunta: "¿Cuál es el planeta más grande del sistema solar?", respuesta: "jupiter", opciones: ["Marte", "Júpiter", "Saturno", "Neptuno"] },
    { pregunta: "¿Cuántos huesos tiene el cuerpo humano adulto?", respuesta: "206", opciones: ["206", "205", "210", "200"] },
    { pregunta: "¿Cuál es el elemento químico más abundante en el universo?", respuesta: "hidrogeno", opciones: ["Oxígeno", "Hidrógeno", "Carbono", "Helio"] },
    { pregunta: "¿Qué gas respiramos principalmente?", respuesta: "oxigeno", opciones: ["Nitrógeno", "Oxígeno", "Dióxido de carbono", "Helio"] },
    { pregunta: "¿Cuál es el hueso más largo del cuerpo humano?", respuesta: "femur", opciones: ["Húmero", "Fémur", "Tibia", "Radio"] },
    { pregunta: "¿Cuál es el metal más abundante en la corteza terrestre?", respuesta: "aluminio", opciones: ["Hierro", "Aluminio", "Cobre", "Oro"] },
    { pregunta: "¿Qué vitamina proporciona el sol a nuestro cuerpo?", respuesta: "d", opciones: ["Vitamina A", "Vitamina B", "Vitamina C", "Vitamina D"] },
    { pregunta: "¿Cuál es el planeta más cercano al Sol?", respuesta: "mercurio", opciones: ["Venus", "Mercurio", "Marte", "Tierra"] },
    { pregunta: "¿Cuántos cromosomas tiene el ser humano?", respuesta: "46", opciones: ["23", "46", "48", "44"] },
    { pregunta: "¿Cuál es el órgano más grande del cuerpo humano?", respuesta: "piel", opciones: ["Hígado", "Piel", "Intestino", "Pulmón"] },
    { pregunta: "¿Qué planeta es conocido como el planeta rojo?", respuesta: "marte", opciones: ["Venus", "Marte", "Júpiter", "Saturno"] },
    { pregunta: "¿Cuál es la velocidad de la luz?", respuesta: "300000", opciones: ["150,000 km/s", "300,000 km/s", "500,000 km/s", "1,000,000 km/s"] },
    { pregunta: "¿Cuántos planetas hay en el sistema solar?", respuesta: "8", opciones: ["7", "8", "9", "10"] },
    { pregunta: "¿Qué gas es el más abundante en la atmósfera terrestre?", respuesta: "nitrogeno", opciones: ["Oxígeno", "Nitrógeno", "CO2", "Argón"] },
    { pregunta: "¿Cuál es el animal más grande del mundo?", respuesta: "ballena azul", opciones: ["Elefante", "Ballena azul", "Jirafa", "Tiburón"] },

    // Historia
    { pregunta: "¿En qué año llegó el hombre a la Luna?", respuesta: "1969", opciones: ["1965", "1969", "1972", "1968"] },
    { pregunta: "¿En qué año comenzó la Segunda Guerra Mundial?", respuesta: "1939", opciones: ["1939", "1940", "1938", "1941"] },
    { pregunta: "¿En qué año se descubrió América?", respuesta: "1492", opciones: ["1490", "1492", "1500", "1485"] },
    { pregunta: "¿Quién fue el primer presidente de Estados Unidos?", respuesta: "washington", opciones: ["Lincoln", "Washington", "Jefferson", "Adams"] },
    { pregunta: "¿En qué año cayó el Muro de Berlín?", respuesta: "1989", opciones: ["1987", "1989", "1991", "1985"] },
    { pregunta: "¿Quién fue Cleopatra?", respuesta: "reina", opciones: ["Reina de Egipto", "Diosa griega", "Emperatriz romana", "Princesa persa"] },
    { pregunta: "¿En qué año comenzó la Primera Guerra Mundial?", respuesta: "1914", opciones: ["1912", "1914", "1916", "1918"] },
    { pregunta: "¿Quién pintó la Capilla Sixtina?", respuesta: "miguel angel", opciones: ["Leonardo", "Miguel Ángel", "Rafael", "Donatello"] },
    { pregunta: "¿En qué año se hundió el Titanic?", respuesta: "1912", opciones: ["1910", "1912", "1914", "1908"] },
    { pregunta: "¿Quién fue Napoleón Bonaparte?", respuesta: "emperador", opciones: ["Rey de España", "Emperador de Francia", "Zar de Rusia", "Rey de Inglaterra"] },

    // Geografía
    { pregunta: "¿Cuál es el océano más grande del mundo?", respuesta: "pacifico", opciones: ["Atlántico", "Índico", "Pacífico", "Ártico"] },
    { pregunta: "¿Cuántos continentes hay en el mundo?", respuesta: "7", opciones: ["5", "6", "7", "8"] },
    { pregunta: "¿Cuál es el río más largo del mundo?", respuesta: "amazonas", opciones: ["Nilo", "Amazonas", "Misisipi", "Yangtsé"] },
    { pregunta: "¿Cuál es el país más grande del mundo?", respuesta: "rusia", opciones: ["Canadá", "China", "Estados Unidos", "Rusia"] },
    { pregunta: "¿En qué continente está Egipto?", respuesta: "africa", opciones: ["Asia", "Europa", "África", "Oceanía"] },
    { pregunta: "¿Cuál es la capital de Japón?", respuesta: "tokio", opciones: ["Kioto", "Tokio", "Osaka", "Hiroshima"] },
    { pregunta: "¿En qué país se encuentra la Torre Eiffel?", respuesta: "francia", opciones: ["Italia", "Francia", "España", "Alemania"] },
    { pregunta: "¿Cuál es el país con más población del mundo?", respuesta: "india", opciones: ["China", "India", "Estados Unidos", "Indonesia"] },
    { pregunta: "¿Cuál es la capital de Australia?", respuesta: "canberra", opciones: ["Sídney", "Melbourne", "Canberra", "Brisbane"] },
    { pregunta: "¿Cuál es el desierto más grande del mundo?", respuesta: "sahara", opciones: ["Gobi", "Sahara", "Atacama", "Kalahari"] },
    { pregunta: "¿Cuál es la montaña más alta del mundo?", respuesta: "everest", opciones: ["K2", "Everest", "Kilimanjaro", "Mont Blanc"] },
    { pregunta: "¿Cuál es la capital de Brasil?", respuesta: "brasilia", opciones: ["Río de Janeiro", "São Paulo", "Brasilia", "Salvador"] },
    { pregunta: "¿Cuál es el lago más grande del mundo?", respuesta: "caspio", opciones: ["Superior", "Victoria", "Caspio", "Baikal"] },
    { pregunta: "¿Cuál es la capital de Egipto?", respuesta: "cairo", opciones: ["Alejandría", "El Cairo", "Luxor", "Giza"] },

    // Arte y Literatura
    { pregunta: "¿Quién pintó la Mona Lisa?", respuesta: "leonardo", opciones: ["Miguel Ángel", "Leonardo da Vinci", "Rafael", "Botticelli"] },
    { pregunta: "¿Quién escribió 'Don Quijote de la Mancha'?", respuesta: "cervantes", opciones: ["Lope de Vega", "Cervantes", "Quevedo", "Calderón"] },
    { pregunta: "¿Quién desarrolló la teoría de la relatividad?", respuesta: "einstein", opciones: ["Newton", "Einstein", "Galileo", "Hawking"] },
    { pregunta: "¿Quién escribió 'Romeo y Julieta'?", respuesta: "shakespeare", opciones: ["Molière", "Shakespeare", "Dante", "Goethe"] },
    { pregunta: "¿Quién compuso la 'Novena Sinfonía'?", respuesta: "beethoven", opciones: ["Mozart", "Beethoven", "Bach", "Chopin"] },
    { pregunta: "¿Quién escribió 'Cien años de soledad'?", respuesta: "garcia marquez", opciones: ["Borges", "García Márquez", "Vargas Llosa", "Cortázar"] },
    { pregunta: "¿Quién pintó 'La noche estrellada'?", respuesta: "van gogh", opciones: ["Monet", "Van Gogh", "Picasso", "Dalí"] },
    { pregunta: "¿Quién escribió 'El Principito'?", respuesta: "saint-exupery", opciones: ["Julio Verne", "Saint-Exupéry", "Victor Hugo", "Molière"] },

    // Deportes
    { pregunta: "¿Cuántos jugadores tiene un equipo de fútbol en cancha?", respuesta: "11", opciones: ["10", "11", "12", "9"] },
    { pregunta: "¿En qué deporte se usa una raqueta y una pelota amarilla?", respuesta: "tenis", opciones: ["Bádminton", "Tenis", "Squash", "Ping Pong"] },
    { pregunta: "¿Cuántos jugadores hay en un equipo de baloncesto?", respuesta: "5", opciones: ["4", "5", "6", "7"] },
    { pregunta: "¿En qué país se inventó el fútbol moderno?", respuesta: "inglaterra", opciones: ["Brasil", "Inglaterra", "España", "Italia"] },
    { pregunta: "¿Cuántos sets se juegan en un partido de voleibol?", respuesta: "5", opciones: ["3", "4", "5", "6"] },
    { pregunta: "¿Quién tiene más Balones de Oro?", respuesta: "messi", opciones: ["Cristiano Ronaldo", "Messi", "Pelé", "Maradona"] },
    { pregunta: "¿Cuánto dura un partido de fútbol?", respuesta: "90", opciones: ["60 minutos", "90 minutos", "120 minutos", "80 minutos"] },
    { pregunta: "¿En qué deporte se hace un 'home run'?", respuesta: "beisbol", opciones: ["Fútbol", "Béisbol", "Baloncesto", "Tenis"] },

    // Matemáticas
    { pregunta: "¿Cuántos lados tiene un hexágono?", respuesta: "6", opciones: ["5", "6", "7", "8"] },
    { pregunta: "¿Cuántos minutos tiene una hora?", respuesta: "60", opciones: ["50", "60", "100", "120"] },
    { pregunta: "¿Cuántos gramos tiene un kilogramo?", respuesta: "1000", opciones: ["100", "500", "1000", "10000"] },
    { pregunta: "¿Cuál es la raíz cuadrada de 144?", respuesta: "12", opciones: ["10", "12", "14", "16"] },
    { pregunta: "¿Cuántos grados tiene un ángulo recto?", respuesta: "90", opciones: ["45", "90", "180", "360"] },
    { pregunta: "¿Cuál es el resultado de 15 x 15?", respuesta: "225", opciones: ["200", "225", "250", "215"] },
    { pregunta: "¿Cuántos segundos tiene un minuto?", respuesta: "60", opciones: ["30", "60", "100", "120"] },
    { pregunta: "¿Cuál es el valor de Pi aproximado?", respuesta: "3.14", opciones: ["2.14", "3.14", "4.14", "3.41"] },

    // Animales
    { pregunta: "¿Cuál es el animal terrestre más rápido?", respuesta: "guepardo", opciones: ["León", "Guepardo", "Tigre", "Leopardo"] },
    { pregunta: "¿Cuántas patas tiene una araña?", respuesta: "8", opciones: ["6", "8", "10", "4"] },
    { pregunta: "¿Cuál es el único mamífero que puede volar?", respuesta: "murcielago", opciones: ["Ardilla", "Murciélago", "Águila", "Colibrí"] },
    { pregunta: "¿Cuántos corazones tiene un pulpo?", respuesta: "3", opciones: ["1", "2", "3", "4"] },
    { pregunta: "¿Cuál es el animal más venenoso del mundo?", respuesta: "medusa", opciones: ["Serpiente", "Medusa", "Araña", "Escorpión"] },
    { pregunta: "¿Cuántos años puede vivir una tortuga?", respuesta: "150", opciones: ["50 años", "100 años", "150 años", "200 años"] },
    { pregunta: "¿Qué animal es el símbolo de la paz?", respuesta: "paloma", opciones: ["Águila", "Paloma", "Búho", "Colibrí"] },
    { pregunta: "¿Cuál es el ave más grande del mundo?", respuesta: "avestruz", opciones: ["Cóndor", "Avestruz", "Águila", "Albatros"] },

    // Cultura General
    { pregunta: "¿Cuál es el idioma más hablado del mundo?", respuesta: "chino", opciones: ["Inglés", "Español", "Chino", "Hindi"] },
    { pregunta: "¿Cuál es la moneda de Reino Unido?", respuesta: "libra", opciones: ["Euro", "Dólar", "Libra", "Franco"] },
    { pregunta: "¿Cuál es el color del sol?", respuesta: "blanco", opciones: ["Amarillo", "Naranja", "Blanco", "Rojo"] },
    { pregunta: "¿Cuántos colores tiene el arcoíris?", respuesta: "7", opciones: ["5", "6", "7", "8"] },
    { pregunta: "¿Cuántas notas musicales hay?", respuesta: "7", opciones: ["5", "6", "7", "8"] },
    { pregunta: "¿Cuál es el día más corto del año?", respuesta: "21 diciembre", opciones: ["21 junio", "21 diciembre", "21 marzo", "21 septiembre"] },
    { pregunta: "¿En qué país se originó el sushi?", respuesta: "japon", opciones: ["China", "Japón", "Corea", "Tailandia"] },
    { pregunta: "¿Cuántos días tiene febrero en año bisiesto?", respuesta: "29", opciones: ["28", "29", "30", "31"] },

    // Tecnología
    { pregunta: "¿Quién fundó Microsoft?", respuesta: "bill gates", opciones: ["Steve Jobs", "Bill Gates", "Mark Zuckerberg", "Elon Musk"] },
    { pregunta: "¿Quién creó Facebook?", respuesta: "zuckerberg", opciones: ["Bill Gates", "Steve Jobs", "Mark Zuckerberg", "Jeff Bezos"] },
    { pregunta: "¿En qué año se lanzó el primer iPhone?", respuesta: "2007", opciones: ["2005", "2007", "2009", "2010"] },
    { pregunta: "¿Qué significa 'WWW'?", respuesta: "world wide web", opciones: ["World Wide Web", "Web World Wide", "Wide World Web", "World Web Wide"] },
    { pregunta: "¿Quién fundó Tesla?", respuesta: "elon musk", opciones: ["Jeff Bezos", "Bill Gates", "Elon Musk", "Steve Jobs"] },
    { pregunta: "¿Qué empresa creó el sistema operativo Android?", respuesta: "google", opciones: ["Apple", "Microsoft", "Google", "Samsung"] },
    { pregunta: "¿En qué año se fundó Google?", respuesta: "1998", opciones: ["1995", "1998", "2000", "2004"] },
    { pregunta: "¿Quién inventó el teléfono?", respuesta: "bell", opciones: ["Edison", "Bell", "Tesla", "Marconi"] },

    // Anime y Videojuegos
    { pregunta: "¿Quién es el protagonista de 'Naruto'?", respuesta: "naruto", opciones: ["Sasuke", "Naruto", "Kakashi", "Itachi"] },
    { pregunta: "¿De qué color es Pikachu?", respuesta: "amarillo", opciones: ["Rojo", "Amarillo", "Azul", "Verde"] },
    { pregunta: "¿Cómo se llama el protagonista de Mario Bros?", respuesta: "mario", opciones: ["Luigi", "Mario", "Wario", "Yoshi"] },
    { pregunta: "¿Cuál es el videojuego más vendido de la historia?", respuesta: "minecraft", opciones: ["GTA V", "Minecraft", "Tetris", "Fortnite"] },
    { pregunta: "¿Quién es el villano principal de Dragon Ball Z?", respuesta: "freezer", opciones: ["Cell", "Freezer", "Buu", "Vegeta"] },
    { pregunta: "¿Cómo se llama el protagonista de One Piece?", respuesta: "luffy", opciones: ["Zoro", "Luffy", "Sanji", "Nami"] },
    { pregunta: "¿Qué tipo de Pokémon es Charizard?", respuesta: "fuego", opciones: ["Agua", "Fuego", "Planta", "Eléctrico"] },
    { pregunta: "¿Quién es el protagonista de Death Note?", respuesta: "light", opciones: ["L", "Light", "Ryuk", "Misa"] },
];

// Guardar trivias activas por chat
const activeTrivia = new Map();

export default {
    commands: ['trivia', 'quiz'],
    tags: ['games', 'economy'],
    help: ['trivia'],

    async execute(ctx) {
        const { chatId, sender, reply, dbService } = ctx;

        // Verificar si ya hay una trivia activa
        if (activeTrivia.has(chatId)) {
            const trivia = activeTrivia.get(chatId);
            const respuesta = ctx.args.join(' ').toLowerCase().trim();

            if (!respuesta) {
                return await reply(styleText(
                    `ꕤ *Ya hay una trivia activa*\n\n` +
                    `> Responde con: */trivia* <tu respuesta>`
                ));
            }

            // Verificar respuesta
            const esCorrecta = trivia.respuestas.some(r =>
                respuesta.includes(r.toLowerCase())
            );

            if (esCorrecta) {
                const reward = Math.floor(Math.random() * 1001) + 1000; // 1000-2000
                const userData = dbService.getUser(sender);

                dbService.updateUser(sender, {
                    'economy.coins': (userData.economy?.coins || 0) + reward
                });

                activeTrivia.delete(chatId);

                return await reply(styleText(
                    `ꕥ *¡CORRECTO!*\n\n` +
                    `> Respuesta » *${trivia.respuestaOriginal}*\n` +
                    `> Ganaste »  *¥${formatNumber(reward)}* coins\n\n` +
                    `_¡Usa /trivia para otra pregunta!_`
                ));
            } else {
                return await reply(styleText(
                    `ꕤ *Incorrecto*\n\n` +
                    `> Sigue intentando o espera a que expire.`
                ));
            }
        }

        // Crear nueva trivia
        const preguntaData = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];

        // Mezclar opciones
        const opcionesMezcladas = [...preguntaData.opciones].sort(() => Math.random() - 0.5);

        activeTrivia.set(chatId, {
            respuestas: [preguntaData.respuesta, preguntaData.opciones.find(o => o.toLowerCase().includes(preguntaData.respuesta))].filter(Boolean),
            respuestaOriginal: preguntaData.opciones.find(o => o.toLowerCase().includes(preguntaData.respuesta)) || preguntaData.respuesta,
            timestamp: Date.now()
        });

        // Auto-eliminar después de 60 segundos
        setTimeout(() => {
            if (activeTrivia.has(chatId)) {
                activeTrivia.delete(chatId);
            }
        }, 60000);

        const letras = ['A', 'B', 'C', 'D'];
        let opcionesTexto = opcionesMezcladas.map((op, i) => `> ${letras[i]}. ${op}`).join('\n');

        await reply(styleText(
            `🧠 *TRIVIA*\n\n` +
            `❓ *${preguntaData.pregunta}*\n\n` +
            `${opcionesTexto}\n\n` +
            `💰 Premio: *¥1,000 - ¥2,000* coins\n` +
            `⏱️ Tienes 60 segundos\n\n` +
            `_Responde con: /trivia <respuesta>_`
        ));
    }
};
