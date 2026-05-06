import { db } from "../../db";
import localReq from "./local-req";

/**
 * 返回数据是否正常，若不正常要重新创建
 */
export async function findSystem(user_id: string) {

  // 依序查找 users / workspaces / members 的 IndexedDB
  // console.time("fs user")
  const res1 = await db.users.get(user_id)
  // console.timeEnd("fs user")

  if(!res1) return false

  const res2 = await db.workspaces.where("[infoType+owner]").equals(["ME", user_id]).toArray()

  if(!res2 || res2.length < 1) {
    await localReq.deleteUser(res1._id)
    return false
  }
  const space = res2[0]
  const workspace_local = space._id

  // console.time("fs members")
  const res3 = await db.members.where("[user+spaceId]").equals([user_id, workspace_local]).first()
  // console.timeEnd("fs members")

  if(!res3) {
    await localReq.deleteUser(res1._id)
    await localReq.deleteWorkspace(workspace_local)
    return false
  }

  return true
}
