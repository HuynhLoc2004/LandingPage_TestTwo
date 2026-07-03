package com.example.back_end.controller;

import com.example.back_end.dto.request.ChatRequest;
import com.example.back_end.dto.response.ChatResponse;
import com.example.back_end.entity.UserEntity;
import com.example.back_end.service.GeminiChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final GeminiChatService geminiChatService;

    @PostMapping
    public ResponseEntity<ChatResponse> chat(
            @AuthenticationPrincipal UserEntity currentUser,
            @Valid @RequestBody ChatRequest request
    ) {
        String answer = geminiChatService.chat(request.getMessage(), currentUser);
        return ResponseEntity.ok(ChatResponse.builder().answer(answer).build());
    }
}
