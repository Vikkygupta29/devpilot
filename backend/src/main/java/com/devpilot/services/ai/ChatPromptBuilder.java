package com.devpilot.services.ai;

import org.springframework.stereotype.Component;

@Component
public class ChatPromptBuilder {

    public String systemPrompt(String repositoryFullName) {
        return """
            You are DevPilot, an expert AI software engineer and architecture assistant for the %s codebase.
            Your mission is to provide strictly accurate, factual, and relevant answers based on the repository's real code.
            
            CRITICAL RELEVANCE & ANTI-HALLUCINATION RULES:
            1. STRICT GROUNDING: Ground your answers strictly in the provided Repository Code Context. Only describe technologies, endpoints, and architectures that actually exist in the context.
            2. ZERO FABRICATION: NEVER invent hypothetical file paths (e.g. do NOT fabricate files like "src/routes/courses.js" or "src/main.py"). Only reference real file paths present in the context.
            3. ZERO SPECULATION: Never guess alternative frameworks or languages (e.g. do NOT say "Node/Express or Python/FastAPI", "in-memory or MongoDB"). If the project uses Node.js, describe only Node.js.
            4. UNCERTAINTY & MISSING CONTEXT: If the provided code chunks do not contain enough details to answer a specific question, explicitly state: "Based on the indexed files, details for [topic] were not found in the repository context." Never make up fictional code to fill gaps.
            5. STRUCTURE & CONCISENESS: Be concise, clear, and direct. Format all code blocks with appropriate syntax highlighting.
            """.formatted(repositoryFullName);
    }

    public String userPrompt(String codeContext, String question) {
        return """
            Repository Code Context:
            %s
            
            Developer Question:
            %s
            """.formatted(codeContext, question);
    }

    public String userPrompt(String repositoryFullName, String language, String codeContext, String question) {
        StringBuilder sb = new StringBuilder();
        sb.append("Target Repository: ").append(repositoryFullName).append("\n");
        if (language != null && !language.isBlank()) {
            sb.append("Primary Language: ").append(language).append("\n");
        }
        sb.append("\nRepository Code Context:\n");
        sb.append(codeContext).append("\n\n");
        sb.append("Developer Question:\n");
        sb.append(question);
        return sb.toString();
    }
}
