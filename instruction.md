# Instructions

Implement an application for managing infrared (IR) remote control information.

## Requirements

-   Remotes can be registered.
-   Buttons can be added to each remote.
    -   Button addition should trigger a process to receive IR data.
        -   The system should receive IR data from another server.
        -   The system should receive the data three times and ensure it's identical.
        -   The IR data should be saved for the button.
-   A remote list screen should display a list of remotes.
    -   Clicking a remote should navigate to a button detail screen.
-   A remote detail screen should display a list of buttons for the remote.
    -   Each button should have a name, a "Send" button, and a "Delete" button.
    -   A button to add new buttons should be present.
-   The frontend and backend should be separate servers.
-   The backend should receive IR registration information from another server.
-   The frontend should send button press requests to the backend, which will then forward the IR data to an IR transmission service.
-   Use SQLite for the database.
-   Use TypeScript for the frontend with a standard, maintainable framework (React with Vite).
-   Use Go or TypeScript for the backend (TypeScript with Express).
-   The remote list screen should have a "Register Remote" button.
-   The newly registered remotes should appear in the list.
-   The remote detail screen should have a "Register Button" button.
-   After registering a button, the system should wait to receive IR data three times.
-   The IR data capture process should be implemented on the frontend.
-   The IR data capture process should involve receiving IR data from the backend, not prompting the user for input.
-   The IR transmission service should be implemented as a mock server, separate from the backend server.
-   Display a loading icon on the frontend while waiting for IR data.
-   If a button has not received three IR data packets, display a warning icon.
-   If the three IR data packets are not consistent, display an error icon.
-   Each button should have a "Delete" button.
-   Successful buttons should have a "Send" button.
