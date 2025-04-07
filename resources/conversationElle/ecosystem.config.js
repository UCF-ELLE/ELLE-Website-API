module.exports = {
    apps: [
      {
        name: "elle_llm",
        script: "uvicorn",
	      max_memory_restart: "30G",
        args: "loading_qwen:app --host 10.200.8.216 --port 8000",
        interpreter: "python3",
        watch: true,
        env: {
          "PORT": 8000,
          "HOST": "10.200.8.216"
        }
      }
    ]
  };
