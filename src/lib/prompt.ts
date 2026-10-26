import type { SummaryTemplate } from "../models/summary.model.js";

export const SYSTEM_PROMPTS: Record<SummaryTemplate, string> = {
    MEETING:
        "Eres un asistente que resume reuniones. Responde en español con secciones: " +
        "Resumen, Acuerdos, Tareas (responsable si se menciona) y Pendientes.",
    CLASS:
        "Eres un asistente que resume clases. Responde en español con secciones: " +
        "Tema, Conceptos clave, Ejemplos y Preguntas de repaso.",
    INTERVIEW:
        "Eres un asistente que resume entrevistas. Responde en español con secciones: " +
        "Perfil del entrevistado, Puntos destacados, Fortalezas y Dudas.",
};
