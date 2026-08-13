// GENERADO por scripts/build-copia-publica.mjs en cada build. NO EDITAR A MANO.
// Fuentes únicas: exporter/misiones.md (rol y misión de cada clon) y
// exporter/conexiones.md (nombre de cada buzón y agenda).
//
// Viajan con el build a propósito: el service worker guarda los JSON de datos
// hasta 24 h, y un lote cacheado dejaría la flota sin textos y /salud con
// filas anónimas. Del dato solo vienen las claves de cruce y los estados.
import type { OficioPublico, ConexionPublica } from './data'

export const OFICIOS_BUILD: Record<string, OficioPublico> = {
  "clon": {
    "es_rol": "Coordinador del equipo",
    "en_rol": "Team coordinator",
    "es_mision": "Dirige al resto: comprueba que todo esté en pie, reparte cada asunto al clon que le toca y decide qué es lo primero de todo lo que entra en la bandeja única.",
    "en_mision": "Runs the rest of the team: checks that everything is up, routes each matter to the clone it belongs to, and decides what comes first among everything arriving in the single inbox."
  },
  "ceo": {
    "es_rol": "La mirada larga",
    "en_rol": "The long view",
    "es_mision": "Sostiene lo que no urge hoy pero decide el rumbo: las decisiones grandes y las relaciones que hay que cuidar antes de necesitarlas.",
    "en_mision": "Holds what is not urgent today but sets the course: the big decisions, and the relationships worth tending before you need them."
  },
  "patrimonio": {
    "es_rol": "Patrimonio de la familia",
    "en_rol": "Family assets",
    "es_mision": "Cuida lo que la familia tiene: ahorro, inmuebles, impuestos y el trato con los bancos. Avisa antes de que venza un plazo, no después.",
    "en_mision": "Looks after what the family owns: savings, property, taxes and dealings with the banks. It warns before a deadline expires, not after."
  },
  "padre": {
    "es_rol": "La vida de casa",
    "en_rol": "Life at home",
    "es_mision": "Protege la esfera personal: la familia, la salud, el colegio, las vacaciones y el tiempo libre. Es el único clon al que no se le pide productividad.",
    "en_mision": "Protects the personal sphere: family, health, school, holidays and free time. It is the one clone never asked to be productive."
  },
  "licitador": {
    "es_rol": "Concursos públicos",
    "en_rol": "Public tenders",
    "es_mision": "Repasa cada mañana los concursos que publican las administraciones, los puntúa uno a uno y deja preparadas las propuestas técnicas que merecen la pena.",
    "en_mision": "Goes through the tenders published by public bodies every morning, scores them one by one, and drafts the technical proposals worth writing."
  },
  "tecnico": {
    "es_rol": "La sala de máquinas",
    "en_rol": "The engine room",
    "es_mision": "Mantiene y audita la maquinaria del propio clon: el motor que late cada noche, las conexiones con el correo y las agendas, y las instrucciones con las que piensa.",
    "en_mision": "Maintains and audits the clone's own machinery: the engine that beats every night, the links to mail and calendars, and the instructions it thinks with."
  },
  "ideas": {
    "es_rol": "Lo que aún no existe",
    "en_rol": "What does not exist yet",
    "es_mision": "Incubadora sin reglas: el sitio donde se prueba una idea antes de que tenga nombre, y de donde salen los proyectos que después se toman en serio.",
    "en_mision": "An incubator with no rules: where an idea gets tried before it has a name, and where the projects later taken seriously come from."
  }
}

export const CONEXIONES_BUILD: Record<string, ConexionPublica> = {
  "2a5e3926": {
    "es_nombre": "Correo de trabajo (M365)",
    "en_nombre": "Work mail (M365)"
  },
  "2c435866": {
    "es_nombre": "Correo de la asociación (Gmail)",
    "en_nombre": "Association mail (Gmail)"
  },
  "132b93b4": {
    "es_nombre": "Correo de patrimonio (Gmail)",
    "en_nombre": "Assets mail (Gmail)"
  },
  "aefcdbb3": {
    "es_nombre": "Correo personal (iCloud)",
    "en_nombre": "Personal mail (iCloud)"
  },
  "6b996a58": {
    "es_nombre": "Agenda de trabajo (M365)",
    "en_nombre": "Work calendar (M365)"
  },
  "4f1bcdaf": {
    "es_nombre": "Agenda de la asociación (Google)",
    "en_nombre": "Association calendar (Google)"
  },
  "c75c1d4b": {
    "es_nombre": "Agenda de familia (iCloud)",
    "en_nombre": "Family calendar (iCloud)"
  }
}
