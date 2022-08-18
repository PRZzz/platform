import { User } from '../models/User'
import { ClientPatchUser } from '../models/client'
import { Job } from '../queue'
import { getUserFromExternalId } from '../journey/UserRepository'
import { updateLists } from '../lists/ListService'

interface UserPatchTrigger {
    project_id: number
    user: ClientPatchUser
}

export default class UserPatchJob extends Job {
    static $name = 'user_patch'

    static from(data: UserPatchTrigger): UserPatchJob {
        return new this(data)
    }

    static async handler({ project_id, user: { external_id, data, ...fields } }: UserPatchTrigger) {

        // Check for existing user
        const existing = await getUserFromExternalId(project_id, external_id)

        // If user, update otherwise insert
        const user = existing
            ? await User.updateAndFetch(existing.id, {
                data: data ? { ...existing.data, ...data } : undefined,
                ...fields,
            })
            : await User.insertAndFetch({
                project_id,
                external_id,
                data,
                ...fields,
            })

        // Use updated user to check for list membership
        await updateLists(user)
    }
}
