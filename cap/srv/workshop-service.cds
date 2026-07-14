/**
 * CAP service that fronts the Workshop Hub for the Fiori app.
 *
 * The entities are not persisted in the CAP database (`@cds.persistence.skip`):
 * every read and action is delegated to the remote Workshop Hub REST API by the
 * handlers in `workshop-service.js`. The target Hub is configurable via the
 * WORKSHOP_HUB_URL / WORKSHOP_PASSWORD environment variables, so the same build
 * runs against a local Hub or the hosted cloud Hub.
 */
service WorkshopHubService @(path: '/workshop-hub') {

    /** Canonical workshop task list, sourced from the Hub. */
    @readonly
    @cds.persistence.skip
    entity Tasks {
        key taskId      : String;
            title       : String;
            description : String;
            ordinal     : Integer;
    }

    /** Live activity feed, newest first. */
    @readonly
    @cds.persistence.skip
    entity Feed {
        key id            : Integer64;
            participantId : String;
            displayName   : String;
            eventType     : String;
            taskId        : String;
            message       : String;
            status        : String;
            timestamp     : Timestamp;
            metadata      : String;
    }

    /** Current connection state of this CAP instance to the Hub (single row, id = 'current'). */
    @readonly
    @cds.persistence.skip
    entity Connection {
        key id                : String;
            hubUrl            : String;
            connected         : Boolean;
            participantId     : String;
            displayName       : String;
            avatarSet         : Boolean;
            passwordProtected : Boolean;
    }

    /**
     * Team avatars as an OData V4 media entity. Read streams the image back from
     * the Hub; uploads go through the `uploadAvatar` action below.
     */
    @readonly
    @cds.persistence.skip
    entity Avatars {
        key participantId : String;

            @Core.IsMediaType
            contentType   : String;

            @Core.MediaType: contentType
            data          : LargeBinary;
    }

    /** Register this participant/team with the Hub and remember the connection. */
    action register(displayName : String) returns Connection;

    /** Upload the current participant's avatar image (base64-encoded bytes). */
    action uploadAvatar(image : LargeBinary) returns Connection;

    /** Announce that work on a task has started. */
    action startTask(taskId : String) returns Feed;

    /** Announce that a task has been completed. */
    action completeTask(taskId : String, message : String) returns Feed;

    /** Pass a checkpoint (shown prominently on the projector dashboard). */
    action passCheckpoint(taskId : String, message : String) returns Feed;

    /** Report a failed verification for a task. */
    action reportFailure(taskId : String, message : String) returns Feed;

    /** Send a chat message into the feed. */
    action sendChatMessage(message : String) returns Feed;

    /** Send an anonymous heartbeat so the dashboard keeps a live pulse. */
    action heartbeat();

    /** Probe the Hub's /health endpoint. */
    function health() returns {
        status    : String;
        timestamp : Timestamp;
    };
}
