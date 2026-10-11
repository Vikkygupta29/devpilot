package com.devpilot.services.ai;

import com.devpilot.dto.CitationDto;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class CitationMapper {

    private final ObjectMapper objectMapper;

    public CitationDto fromDocument(Document document) {
        if (document == null) return null;
        Map<String, Object> metadata = document.getMetadata();
        String filePath = metadata.get("filePath") != null ? String.valueOf(metadata.get("filePath")) : null;
        String language = metadata.get("language") != null ? String.valueOf(metadata.get("language")) : null;
        Integer startLine = metadata.get("startLine") instanceof Number n ? n.intValue() : null;
        Integer endLine = metadata.get("endLine") instanceof Number n ? n.intValue() : null;

        return new CitationDto(filePath, startLine, endLine, language);
    }

    public String toJson(List<CitationDto> citations) {
        if (citations == null || citations.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(citations);
        } catch (Exception ex) {
            log.warn("Failed to serialize citations to JSON: {}", ex.getMessage());
            return null;
        }
    }

    public List<CitationDto> fromJson(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<CitationDto>>() {});
        } catch (Exception ex) {
            log.warn("Failed to deserialize citations from JSON: {}", ex.getMessage());
            return List.of();
        }
    }
}
