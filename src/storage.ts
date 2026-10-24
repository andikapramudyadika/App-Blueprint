import Dexie from 'dexie'
import type { Table } from 'dexie'
import type { Project } from './model'

export class BlueprintDB extends Dexie {
  projects!: Table<Project, string>
  constructor(name = 'app-blueprint') { super(name); this.version(1).stores({ projects: 'id,updatedAt,name,status' }) }
}
export const db = new BlueprintDB()

// One serialized writer prevents older snapshots from overtaking newer ones.
export class SaveQueue {
  private tail: Promise<unknown> = Promise.resolve()
  constructor(private write: (project: Project) => Promise<unknown> = p => db.projects.put(p)) {}
  save(project: Project) {
    const snapshot = structuredClone(project)
    const task = this.tail.catch(() => undefined).then(() => this.write(snapshot))
    this.tail = task
    return task
  }
}
export async function importProjects(projects: Project[]) {
  await db.transaction('rw', db.projects, async () => { await db.projects.bulkPut(projects) })
}
