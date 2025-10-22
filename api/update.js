import { Octokit } from "octokit";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: "Missing content in request body" });
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  const owner = "cdndc";
  const repo = "vercel";
  const path = "data.json";

  try {
    const { data: fileData } = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      { owner, repo, path }
    );

    const response = await octokit.request(
      "PUT /repos/{owner}/{repo}/contents/{path}",
      {
        owner,
        repo,
        path,
        message: "Update data.json via Vercel endpoint",
        content: Buffer.from(content).toString("base64"),
        sha: fileData.sha
      }
    );

    res.status(200).json({ status: "success", commit: response.data.commit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
