# Thor's Codex

Thor's Codex is a project that aims to index all of Pirate Software's available VODs from YouTube and the content of the TTS Discord channel. The project provides a search engine for the words said during these VODs, making it easier to find specific moments and information. In the future, we plan to run a local RAG and LLM to summarize large parts of the VODs. This page hosts the HTML and JavaScript to interact with the application.

## Updates 
  - I implemented a system to better remove white spaces and fillter blocks.
       -  Added in a new system to stitch together captions to create more complete thoughts (using gpt).
       -  Added in a max length system to prevent run-on-meandering sentences from getting added as one long caption.
       -  Whole database has been reproccessed. Performance should be improved.
       -  Next update will change how the search behaves and it will be getting alot closer!
  - I am going to reintroduct Ngrams and embeded vector searching in the default search experence now. With out vectors but using NGrams and BM25 is resulting in a very good experence, albit not as fast as i would love. 
  - I added functionality to automatically update dependencies that the data importer uses to get transcripts. This should prevent it from breaking when YT changes things on their end. It also now does a "state of the data" check and adds/removes videos as their availibitly changes. 
  - Changed how much of the screen is used in the non-mobile views, should allow the summeries to fit better on the screen. 
  - Moving away from the search service, mostly because i dont want to pay for something that isn't working the way it want it to. Adding a Hybrid Search endpoint that will eventually become the primary experence once i work out all of the kinks.
  
## Project Overview

- **Project Name**: Thor's Codex
- **Description**: A static HTML/JS page to host an index of Pirate Software's VODs and Discord content, providing a searchable interface.
- **Future Plans**: Implement a local RAG and LLM to summarize VOD content.

## Features

- Indexes PirateSoftware's YouTube VODs and Discord channel content (only the tts section, soon to be added).
- Provides a search engine to find specific words said during VODs.
- Give context to each search result using an LLM to summerize a portion of the video. 
- This repo is just the static files to host the HTML and JavaScript to interact with the application.

## LLM Summerization
Here is list of what i am currently doing & what i want to do with AI/LLM's in this project. I will do more if i can figure out how to do it cost-effectively. Currently there is over 4m sentences from thor and 100's of hours of video/audio. I may look at local LLM's to do some of the future ideas listed below. 

 - Currently chunking the videos into 30 minute segements for display/performance purposes
 - The LLM is reading the transcript that is generated by YT to make the summary.
 - Future enhancements: LLM Audio transcript - strip out the audio track of each video and send it up to an LLM to do a transcription on that. This will remove the [__] curse filtering that is happening right now. 
 - Future enhancements: Ground the LLM in all of the transcripts and additional info before doing summerization
 - Future enhancements: Improve summaries by running them through different LLM models, to change up the "Same intro every time" to each summary.
 - Future enhancements: Add even more context to summerization by taking out frames of the video and having them parsed and fed into the prompt. 

## Architecture

This system uses a combination of:
- **Static HTML/JS pages** : This repo,  to provide the user interface.
- **[ThorsCodex.Transcripts.to.CSV](https://github.com/Graf3x/ThorsCodex.Transcripts.to.CSV)** : Quick app to gather transcript text.
- **Serverless functions**: API's to route requests and scale based on traffic load. These services will later down-step traffic to different experences for searching based on server load/traffic. Those experences are listed below:

## Searching 

  - **Current Search Experence**: NoSQL DB and a Full Text search, it uses BM25 which from my understanding can not handle multiword phrases. Currently working around this by making "cursed quest" into "cursed" "quest" and saying it needs to find all of the strings.
  - **Advanced Experience**: Uses RAG and LLM to return responses. (Hybrid Search?)
  - **Prime Experience**: Uses asure ai search or elastic/solar or similar tools for searches.
  - **Fallback Experience**: Uses a normal DB search (ie: contains) as an initial, simple fallback.
  
  **Known Issues**
  - Using "word1 word2" will not return that exact phrase. This is a current limitation of the searching algo. It uses BM25 and that, from my understanding, can not handle multi word phrases. I break the words up and tell it to do a "ALL" right now as a work around till the newer search experence is added.
  - Using "" results in a shorter than expected word list of videos.
   Non-quoted words hit a summery list of words used in a segment of a video, so it is able to index a few 100 documents instead of a few 1000 and return very quickly. When you use a quote and other words you are saying "I want this exact word and other words in my transcript result". So i do the searching differently and it takes a significantly more resources. To keep this reasonable for the user and the free service, i return less results per search button click. 
  
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
