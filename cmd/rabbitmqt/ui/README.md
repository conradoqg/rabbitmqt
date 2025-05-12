<!--
UI Folder README: Documentation for the static web UI assets of RabbitMQT.
-->

# RabbitMQT Web UI

This folder contains the static web UI assets for the RabbitMQT management interface.

## Technologies
- Preact: lightweight React-like library for building UI components.
- HTM: JSX-like tagged template literals for Preact.
- @preact/signals: reactive state management using signals.
- TailwindCSS & DaisyUI: utility-first CSS framework with UI components plugin.
- Material Design Icons: icon set via CDN.
- Day.js & Numeral.js: date/time formatting and number formatting via CDN.

## Usage

- **Standalone**: Open `index.html` in a modern browser. UI modules are loaded via ES modules and ES import maps.
- **With Proxy Server**: Place this `ui` folder alongside the `rabbitmqt` binary, or build with Go's `embed` directive. The Go server will serve these files and replace the `%%DEFAULT_URL%%` placeholder in `index.html` with the configured RabbitMQ Management API URL.

## File Overview

- `index.html`: Main entry point. Sets up import map, CSS/JS dependencies, and injects the default API URL.
- `App.js`: Root component. Renders the navigation bar, tabs, toast notifications, and page components based on application state.
- `api.js`: `ApiService` class responsible for proxying HTTP requests from the UI to the RabbitMQ HTTP API (`/proxy` endpoint), handling authentication and error mapping.
- `store.js`: Defines application state signals (`url`, `username`, `password`, `activeTab`, etc.) and actions (`fetchData`, `changeTab`, toast notifications, theme toggling).
- `components/`: Contains reusable UI components:
  - `Layout.js`: `NavBar`, `Tabs`, and `Toasts` components for layout and navigation.
  - `GenericList.js`: Generic table list view with sorting, filtering, and pagination controls.
  - `Cells.js`: Cell renderer components for table columns (e.g., `NameCell`, `ByteRender`, `RateRender`).
  - `Pages.js`: Page components for each management view (Overview, Vhosts, Exchanges, Queues, Connections, Channels, Policies, Limits).

## Development

1. Modify component or store files in this folder.
2. Refresh the browser to see changes. The UI loads modules dynamically via ES module imports.
3. When embedding in the Go binary, rebuild the Go project (`make build-rabbitmqt`).

## Placeholder Replacement

The Go proxy server replaces the `%%DEFAULT_URL%%` placeholder in `index.html` with the value of the `DEFAULT_URL` environment variable at runtime.
To override the embedded UI, create a `ui` directory next to the binary.