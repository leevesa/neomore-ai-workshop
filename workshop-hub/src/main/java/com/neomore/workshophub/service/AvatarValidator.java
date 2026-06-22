package com.neomore.workshophub.service;

import org.springframework.stereotype.Service;

import com.neomore.workshophub.config.WorkshopProperties;

/**
 * Validates uploaded avatar images: only real PNG/JPEG/WEBP files (detected via
 * magic bytes, not a client-supplied content type) and within the configured
 * size cap are accepted. Returns the detected MIME type so it can be stored and
 * replayed verbatim.
 */
@Service
public class AvatarValidator {

    private final long maxBytes;

    public AvatarValidator(WorkshopProperties properties) {
        this.maxBytes = properties.getAvatar().getMaxBytes();
    }

    /**
     * @return the detected image MIME type (e.g. {@code image/png})
     * @throws IllegalArgumentException if the bytes are empty, too large, or not
     *                                  a supported image
     */
    public String validate(byte[] data) {
        if (data == null || data.length == 0) {
            throw new IllegalArgumentException("Avatar image is empty");
        }
        if (data.length > maxBytes) {
            throw new IllegalArgumentException(
                    "Avatar image is " + data.length + " bytes, exceeds the maximum of " + maxBytes + " bytes");
        }
        String mime = detectMime(data);
        if (mime == null) {
            throw new IllegalArgumentException("Unsupported image type — use PNG, JPEG, or WEBP");
        }
        return mime;
    }

    private String detectMime(byte[] d) {
        if (startsWith(d, 0x89, 0x50, 0x4E, 0x47)) {
            return "image/png";
        }
        if (startsWith(d, 0xFF, 0xD8, 0xFF)) {
            return "image/jpeg";
        }
        if (d.length >= 12 && startsWith(d, 0x52, 0x49, 0x46, 0x46)
                && d[8] == 'W' && d[9] == 'E' && d[10] == 'B' && d[11] == 'P') {
            return "image/webp";
        }
        return null;
    }

    private boolean startsWith(byte[] data, int... prefix) {
        if (data.length < prefix.length) {
            return false;
        }
        for (int i = 0; i < prefix.length; i++) {
            if ((data[i] & 0xFF) != prefix[i]) {
                return false;
            }
        }
        return true;
    }
}
