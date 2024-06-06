import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"

@Entity_()
export class LRTCampaignRecipient {
    constructor(props?: Partial<LRTCampaignRecipient>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @Column_("text", {nullable: false})
    campaign!: string

    @Index_()
    @Column_("text", {nullable: false})
    recipient!: string

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    balance!: bigint

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    elPoints!: bigint
}
