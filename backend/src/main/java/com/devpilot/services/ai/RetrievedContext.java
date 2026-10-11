package com.devpilot.services.ai;

import com.devpilot.dto.CitationDto;
import java.util.List;

public record RetrievedContext(
        List<CitationDto> citations,
        String contextText) {
}
