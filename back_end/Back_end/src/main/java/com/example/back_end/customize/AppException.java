package com.example.back_end.customize;

import lombok.Getter;
import lombok.Setter;
import org.springframework.http.HttpStatus;

@Getter
@Setter
public class AppException extends RuntimeException {
    private HttpStatus status;
    private String message;

    public AppException(HttpStatus status, String message) {
        super();
        this.status = status;
        this.message = message;
    }
}