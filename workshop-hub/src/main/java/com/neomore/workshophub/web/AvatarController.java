package com.neomore.workshophub.web;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.neomore.workshophub.model.Avatar;
import com.neomore.workshophub.service.AvatarService;

import lombok.RequiredArgsConstructor;

/**
 * Upload and serve participant avatars as raw image blobs.
 *
 * <ul>
 *   <li>{@code POST .../avatar} — body is the raw image bytes; the image type is
 *       detected and validated server-side. Returns 204.</li>
 *   <li>{@code GET .../avatar} — returns the stored image with its content type.</li>
 * </ul>
 */
@RestController
@RequestMapping("/participants/{participantId}/avatar")
@RequiredArgsConstructor
public class AvatarController {

    private final AvatarService avatarService;

    @PostMapping
    public ResponseEntity<Void> upload(
            @PathVariable String participantId,
            @RequestBody byte[] data) {
        avatarService.store(participantId, data);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @GetMapping
    public ResponseEntity<byte[]> fetch(
            @PathVariable String participantId) {
        Avatar avatar = avatarService.get(participantId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(avatar.getContentType()))
                .cacheControl(CacheControl.noCache())
                .body(avatar.getData());
    }
}
