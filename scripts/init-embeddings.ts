import { generateEmbeddingsFromGitHub } from '../src/lib/embeddings/generator';
import { closeConnection } from '../src/lib/db/client';

async function main() {
  const owner = process.env.GITHUB_OWNER || 'fredrikburmester';
  const repo = process.env.GITHUB_REPO || 'streamyfin';
  const branch = process.env.GITHUB_BRANCH || 'develop';
  const forceRegenerate = Bun.argv.includes('--force');

  console.log('Initializing embeddings from GitHub...');
  console.log(`Repository: ${owner}/${repo}@${branch}`);
  console.log(`Force regenerate: ${forceRegenerate}`);

  try {
    const totalChunks = await generateEmbeddingsFromGitHub({
      owner,
      repo,
      branch,
      forceRegenerate,
    });
    console.log(`\n✓ Successfully generated ${totalChunks} embeddings`);
    await closeConnection();
    process.exit(0);
  } catch (error) {
    console.error('Failed to generate embeddings:', error);
    await closeConnection();
    process.exit(1);
  }
}

main();

