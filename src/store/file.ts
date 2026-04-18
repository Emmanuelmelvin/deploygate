import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import type { Deployment } from '../types.js';
import type { StateStore } from './index.js';

const DEPLOYMENTS_FILE = 'deployments.json';

export class FileStore implements StateStore {
  private dataDir: string;

  constructor(dataDir: string = './deploygate-data') {
    this.dataDir = dataDir;
  }

  private getFilePath(): string {
    return join(this.dataDir, DEPLOYMENTS_FILE);
  }

  private async ensureDir(): Promise<void> {
    if (!existsSync(this.dataDir)) {
      await mkdir(this.dataDir, { recursive: true });
    }
  }

  private async readFile(): Promise<Record<string, Deployment>> {
    try {
      const content = await readFile(this.getFilePath(), 'utf-8');
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  private async writeFile(data: Record<string, Deployment>): Promise<void> {
    await this.ensureDir();
    await writeFile(
      this.getFilePath(),
      JSON.stringify(data, null, 2),
      'utf-8'
    );
  }

  async get(id: string): Promise<Deployment | null> {
    const data = await this.readFile();
    return data[id] || null;
  }

  async set(id: string, deployment: Deployment): Promise<void> {
    const data = await this.readFile();
    data[id] = deployment;
    await this.writeFile(data);
  }

  async list(): Promise<Deployment[]> {
    const data = await this.readFile();
    return Object.values(data);
  }

  async delete(id: string): Promise<void> {
    const data = await this.readFile();
    delete data[id];
    await this.writeFile(data);
  }
}
