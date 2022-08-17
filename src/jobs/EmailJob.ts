import { Job } from '../queue'
import { User } from '../models/User'
import App from '../app'
import { UserEvent } from '../sender/journey/UserEvent'
import { EmailTemplate } from '../models/Template'
import { createEvent } from '../sender/journey/UserEventRepository'
import { MessageTrigger } from '../models/MessageTrigger'

export default class EmailJob extends Job {
    static $name = 'email'

    static from(data: MessageTrigger): EmailJob {
        return new this(data)
    }

    static async handler({ template_id, user_id, event_id }: MessageTrigger) {

        // Pull user & event details
        const user = await User.find(user_id)
        const event = await UserEvent.find(event_id)
        const template = await EmailTemplate.find(template_id)

        // If user or template has been deleted since, abort
        if (!user || !template) return

        // Send and render email
        await App.main.mailer.send(template, { user, event })

        // Create an event on the user about the email
        createEvent(user_id, 'email_sent', {
            // TODO: Add whatever other attributes
        })
    }
}