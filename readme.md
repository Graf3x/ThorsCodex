# Thor's Codex

Thor's Codex is a project that aims to index all of Pirate Software's available VODs from YouTube and the content of the Discord channel. The project provides a search engine for the words said during these VODs, making it easier to find specific moments and information. In the future, we plan to run a local RAG and LLM to summarize large parts of the VODs. This page hosts the HTML and JavaScript to interact with the application.

## Project Overview

- **Project Name**: Thor's Codex
- **Description**: A static HTML/JS page to host an index of Pirate Software's VODs and Discord content, providing a searchable interface.
- **Future Plans**: Implement a local RAG and LLM to summarize VOD content.

## Features

- Indexes PirateSoftware's YouTube VODs and Discord channel content (only the tts section).
- Provides a search engine to find specific words said during VODs.
- This is just the static files to host the HTML and JavaScript to interact with the application.

## Architecture

This system uses a combination of:
- **Static HTML/JS pages** : This repo,  to provide the user interface.
- **[ThorsCodex.Transcripts.to.CSV](https://github.com/Graf3x/ThorsCodex.Transcripts.to.CSV)** : Quick app to gather transcript text.
- **Serverless functions** to route requests and scale based on traffic load. These functions handle:
  - **Advanced Experience**: Uses RAG and LLM to return responses.
  - **Prime Experience**: Uses cognitive services or similar tools for searches.
  - **First Experience**: Uses a normal DB search as an initial, simple fallback.
  - **Fallback Experience**: Currently to be determined, possibly a YouTube search.

## Getting Started

To get started with Thor's Codex, follow these steps:

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/thorscodex.git
    ```

2. Navigate to the project directory:
    ```sh
    cd thorscodex
    ```

3. Open the `index.html` file in your web browser to interact with the application.

## Contributing

We welcome contributions to improve Thor's Codex. Feel free to submit pull requests or open issues for any bugs or feature requests.

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

For questions or suggestions, please reach out to us via the repository's issue tracker.

---

*Happy searching through Pirate Software's archives!*
