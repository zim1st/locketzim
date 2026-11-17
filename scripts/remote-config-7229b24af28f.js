/*
 * Locket / Shadowrocket: independent Remote Config build, revision 4.
 * Target: configured video duration, existing audio flags and filter diagnostics.
 * Does not implement image generation or grant server-side access.
 * Duration overrides only modify existing keys. Revision 2 also supplies
 * a small set of missing filter UI controls in recognized configurations.
 * See README.md and docs/AI-PHOTOBOOTH.md for evidence and limitations.
 */
(function () {
    "use strict";

    var ENDPOINT = /^https:\/\/firebaseremoteconfig\.googleapis\.com\/v1\/projects\/locket-4252a\/namespaces\/[^/?]+:fetch(?:\?|$)/;
    var BUILD_CONFIG = {"videoSeconds":120};
    var VIDEO_SECONDS = BUILD_CONFIG.videoSeconds || 120;
    var PREFIX = "[Locket Zim] ";
    var REVISION = "v4";
    // Only edit these flags when the server actually supplies them. These names
    // come from the archived community schema, not a public Locket guarantee.
    var AUDIO_KEYS = [
        "video_sound_enabled", "video_audio_enabled", "microphone_enabled",
        "camera_microphone_enabled", "audio_enabled", "sound_enabled", "record_audio_enabled"
    ];

    function log(message) {
        if (typeof console !== "undefined" && typeof console.log === "function") {
            console.log(PREFIX + message);
        }
    }

    function isObject(value) {
        return value !== null && typeof value === "object" && !Array.isArray(value);
    }

    function has(object, key) {
        return Object.prototype.hasOwnProperty.call(object, key);
    }

    if (typeof $request === "undefined" || !ENDPOINT.test($request.url || "")) {
        return $done({});
    }

    if (typeof $response === "undefined") {
        var requestHeaders = Object.assign({}, $request.headers || {});
        Object.keys(requestHeaders).forEach(function (key) {
            if (/^(if-none-match|if-modified-since|x-goog-if-none-match|x-firebase-etag)$/i.test(key)) {
                delete requestHeaders[key];
            }
        });
        // Header changes cannot bypass Firebase's on-device fetch interval.
        return $done({ headers: requestHeaders });
    }

    var rawStatus = $response.statusCode || $response.status;
    if (rawStatus !== undefined) {
        var statusMatch = String(rawStatus).match(/(?:^|\s)(\d{3})(?:\s|$)/);
        if (!statusMatch || Number(statusMatch[1]) !== 200) {
            log("Skipped non-200 response.");
            return $done({});
        }
    }

    try {
        var body = JSON.parse($response.body);
        if (!isObject(body) || !isObject(body.entries)) {
            log("No entries; waiting for a full Remote Config fetch.");
            return $done({});
        }

        var entries = body.entries;
        var changes = [];
        var beforeFilters = objectValue(entries.camera_filter_config);
        var beforeCelebrity = objectValue(entries.celebrity_filter_config);
        log(REVISION + " input schema: " +
            catalogSummary("camera_filter_config", beforeFilters) + "; " +
            catalogSummary("celebrity_filter_config.cameraFilterConfig", beforeCelebrity && beforeCelebrity.cameraFilterConfig));
        log(REVISION + " audio input: " + audioSummary(entries));

        function updateExisting(object, keys, value, path) {
            keys.forEach(function (key) {
                if (!has(object, key)) return;
                var current = object[key];
                var next;
                if (typeof value === "number") {
                    // Avoid overwriting objects, nulls or unknown enum values.
                    if (typeof current !== "number" && !(typeof current === "string" && /^\d+(\.\d+)?$/.test(current))) return;
                    next = typeof current === "string" ? String(value) : value;
                } else if (typeof value === "boolean") {
                    if (typeof current === "boolean") next = value;
                    else if (current === "true" || current === "false") next = String(value);
                    else return;
                } else {
                    // Feature gates observed in community configurations use enums.
                    if (typeof current === "boolean") next = true;
                    else if (typeof current === "string") next = value;
                    else return;
                }
                if (current !== next) {
                    object[key] = next;
                    changes.push(path + key);
                }
            });
        }

        function objectValue(value) {
            try {
                var parsed = typeof value === "string" ? JSON.parse(value) : value;
                return isObject(parsed) ? parsed : null;
            } catch (_) {
                return null;
            }
        }

        function editObjectEntry(key, edit, createMissing) {
            if (!has(entries, key) && !createMissing) return;
            var original = has(entries, key) ? entries[key] : "{}";
            var parsed = objectValue(original);
            if (!parsed) return;
            var previousCount = changes.length;
            edit(parsed, key + ".");
            if (changes.length !== previousCount) {
                entries[key] = typeof original === "string" ? JSON.stringify(parsed) : parsed;
            }
        }

        var durationKeys = [
            "gold_max_duration", "goldMaxDuration", "max_duration", "maxDuration",
            "video_max_duration", "videoMaxDuration", "max_video_duration", "maxVideoDuration",
            "trim_max_duration", "trimMaxDuration", "camera_roll_max_duration", "cameraRollMaxDuration"
        ];
        ["camera", "camera_roll"].forEach(function (key) {
            editObjectEntry(key, function (settings, path) {
                updateExisting(settings, durationKeys, VIDEO_SECONDS, path);
                updateExisting(settings, AUDIO_KEYS, true, path);
                if (isObject(settings.trimmer)) {
                    updateExisting(settings.trimmer, durationKeys, VIDEO_SECONDS, path + "trimmer.");
                }
            });
        });
        updateExisting(entries, [
            "camera_roll_video_max_duration", "camera_roll_max_duration",
            "camera_roll_video_trim_max_duration", "video_trimmer_max_duration",
            "video_max_duration", "max_video_duration", "longer_video_duration",
            "longer_video_max_duration", "camera_video_max_duration", "camera_max_duration",
            "max_recording_duration", "recording_max_duration", "gold_max_duration",
            "camera_roll_video_max_duration_sec", "video_max_duration_sec"
        ], VIDEO_SECONDS, "");
        updateExisting(entries, AUDIO_KEYS.concat(["camera_roll_video_sound_enabled"]), true, "");

        editObjectEntry("feature_gates", function (gates, path) {
            updateExisting(gates, [
                "longer_video", "longer_videos", "camera_roll", "camera_roll_video",
                "camera_roll_video_upload", "longer_camera_roll_videos", "video_trimmer",
                "long_captions", "camera_theme", "app_icon_picker",
                "camera_filter", "camera_filters", "ai_filter", "ai_filters",
                "likeness", "ai_likeness", "photobooth"
            ], "enabled", path);
        });

        updateExisting(entries, [
            "longer_video_enabled", "longer_videos_enabled", "camera_roll_video_enabled",
            "camera_roll_video_upload_enabled", "video_trimmer_enabled",
            "camera_filter_enabled", "camera_filters_enabled", "ai_filters_enabled",
            "camera_filter_sheet_enabled", "camera_filter_picker_enabled",
            "camera_ai_filters_enabled", "likeness_enabled", "ai_likeness_enabled",
            "photobooth_enabled", "sheet_filters_selectable"
        ], true, "");

        function enableFilterControls(settings, path) {
            updateExisting(settings, [
                "showFilterButton", "show_filter_button", "sheetEnabled", "sheet_enabled"
            ], true, path);
        }
        editObjectEntry("camera_filter_config", enableFilterControls);
        editObjectEntry("celebrity_filter_config", function (settings, path) {
            if (isObject(settings.cameraFilterConfig)) {
                enableFilterControls(settings.cameraFilterConfig, path + "cameraFilterConfig.");
            }
        });

        // v1 could leave the button hidden when UI keys were absent. Supply only
        // the documented community UI schema, without replacing server catalogs.
        // A missing button is not evidence of a working server-side AI entitlement.
        var recognizedSettings = ["camera", "camera_roll", "feature_gates", "camera_filter_config", "celebrity_filter_config"].some(function (key) {
            return has(entries, key) && objectValue(entries[key]) !== null;
        });

        function supplyControls(object, keys, value, path) {
            keys.forEach(function (key) {
                if (!has(object, key)) {
                    object[key] = value;
                    changes.push(path + key);
                } else {
                    updateExisting(object, [key], value, path);
                }
            });
        }

        function supplyFilterUI(settings, path) {
            supplyControls(settings, [
                "showFilterButton", "show_filter_button", "sheetEnabled", "sheet_enabled",
                "allowsCustomFilters", "allows_custom_filters",
                "referenceImageAttachmentEnabled", "reference_image_attachment_enabled"
            ], true, path);
        }

        if (recognizedSettings) {
            // Firebase top-level values are strings. Existing booleans retain their
            // representation; malformed values and objects are not overwritten.
            [
                "camera_filter_enabled", "camera_filters_enabled", "ai_filters_enabled",
                "camera_filter_sheet_enabled", "camera_filter_picker_enabled",
                "camera_ai_filters_enabled", "sheet_filters_selectable"
            ].forEach(function (key) {
                if (!has(entries, key)) {
                    entries[key] = "true";
                    changes.push(key);
                } else {
                    updateExisting(entries, [key], true, "");
                }
            });
            editObjectEntry("feature_gates", function (gates, path) {
                supplyControls(gates, ["camera_filter", "camera_filters", "ai_filter", "ai_filters"], "enabled", path);
            }, true);
            editObjectEntry("camera_filter_config", supplyFilterUI, true);
            editObjectEntry("celebrity_filter_config", function (settings, path) {
                // Never invent a celebrity identity or a second empty catalog.
                if (isObject(settings.cameraFilterConfig)) {
                    supplyFilterUI(settings.cameraFilterConfig, path + "cameraFilterConfig.");
                }
            });
        }

        function catalogSummary(key, settings) {
            if (!settings) return key + "=missing-or-invalid";
            var collections = [
                "pickerFilters", "picker_filters", "remoteFilters", "remote_filters", "filters",
                "filterGroups", "filter_groups", "sheetFilters", "sheet_filters"
            ];
            var counts = collections.filter(function (field) {
                return Array.isArray(settings[field]);
            }).map(function (field) {
                return field + ":" + settings[field].length;
            });
            return key + "=" + (counts.length ? counts.join("/") : "no-catalog-arrays");
        }

        function audioSummary(allEntries) {
            function summarize(label, settings, keys) {
                if (!settings) return label + "=missing-or-invalid";
                var present = 0, enabled = 0, disabled = 0, unknown = 0;
                keys.forEach(function (key) {
                    if (!has(settings, key)) return;
                    present += 1;
                    if (settings[key] === true || settings[key] === "true") enabled += 1;
                    else if (settings[key] === false || settings[key] === "false") disabled += 1;
                    else unknown += 1;
                });
                return label + "=(present:" + present + ",enabled:" + enabled + ",disabled:" + disabled + ",unknown:" + unknown + ")";
            }
            return [
                summarize("top", allEntries, AUDIO_KEYS.concat(["camera_roll_video_sound_enabled"])),
                summarize("camera", objectValue(allEntries.camera), AUDIO_KEYS),
                summarize("camera_roll", objectValue(allEntries.camera_roll), AUDIO_KEYS)
            ].join("; ");
        }
        var cameraFilters = objectValue(entries.camera_filter_config);
        var celebrityFilters = objectValue(entries.celebrity_filter_config);
        log(REVISION + " filter diagnostics: " +
            catalogSummary("camera_filter_config", cameraFilters) + "; " +
            catalogSummary("celebrity_filter_config.cameraFilterConfig", celebrityFilters && celebrityFilters.cameraFilterConfig) +
            ". UI flags do not verify AI processing. No image URLs or account data logged.");
        log(REVISION + " audio output: " + audioSummary(entries) + ". Test a newly recorded clip; flags do not prove an audio track exists.");

        if (changes.length === 0) {
            log("No changes: supported settings are absent or already enabled. Device verification is still required.");
            return $done({});
        }
        // Do not invent a template version or replace the remote filter catalog.
        body.state = "UPDATE";
        var responseHeaders = Object.assign({}, $response.headers || {});
        Object.keys(responseHeaders).forEach(function (key) {
            if (/^(content-length|content-encoding|etag)$/i.test(key)) delete responseHeaders[key];
        });
        log("Updated " + changes.length + " keys: " + changes.join(", ") + ". Test recording and filters on the device.");
        return $done({ headers: responseHeaders, body: JSON.stringify(body) });
    } catch (_) {
        log("Skipped unreadable response; original response preserved.");
        return $done({});
    }
})();
