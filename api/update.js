import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { nama, comment } = req.body;
  if (!nama || !comment) {
    return res.status(400).json({ error: "Missing nama or comment" });
  }

  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.APP_ID,
      privateKey: process.env.PRIVATE_KEY,
      installationId: process.env.INSTALLATION_ID,
    },
  });

  try {
    const { data: file } = await octokit.repos.getContent({
      owner: "cdndc",
      repo: "cdndc.github.io",
      path: "data.json",
    });

    const content = Buffer.from(file.content, "base64").toString();
    let comments;

    try {
      const parsed = JSON.parse(content);
      comments = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      comments = [];
    }

    comments.push({
      nama,
      comment,
      updated: new Date().toISOString(),
    });

    const updatedContent = Buffer.from(
      JSON.stringify(comments, null, 2)
    ).toString("base64");

    await octokit.repos.createOrUpdateFileContents({
      owner: "cdndc",
      repo: "cdndc.github.io",
      path: "data.json",
      message: `Add comment from ${nama}`,
      content: updatedContent,
      sha: file.sha,
    });

    res.status(200).json({ success: true, message: "✅ Comment added!" });
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
}
