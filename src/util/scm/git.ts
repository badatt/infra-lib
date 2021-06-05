/**
 * Copyright (c) 2021 Balu Praveen Datty
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { execSync } from 'child_process';

export class Git {
  public repo: string;
  public commitId: string;
  public branch: string;

  constructor() {
    this.repo = execSync('git config --get remote.origin.url').toString().trim();
    this.commitId = execSync('git rev-parse HEAD').toString().trim();
    this.branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  }
}
