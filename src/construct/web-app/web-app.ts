import { CfnOutput, Construct } from "@aws-cdk/core";
import { IHostedZone } from "@aws-cdk/aws-route53";
import { ICertificate } from "@aws-cdk/aws-certificatemanager";
import { BlockPublicAccess, Bucket, ObjectOwnership } from "@aws-cdk/aws-s3";

export interface WebAppProps {
	readonly rootDomain: string;

	readonly subDomain: string;

	readonly hostedZone: IHostedZone;

	readonly certificate: ICertificate;
}

export class WebApp extends Construct {
	public bucket: Bucket;
	constructor(scope: Construct, id: string, props: WebAppProps) {
		super(scope, id);

		const hostedZoneName = props.hostedZone.zoneName;
		const siteUrl = props.subDomain ? props.subDomain + "." + hostedZoneName : hostedZoneName;

		this.bucket = new Bucket(scope, `${id}DeploymentBucket`, {
			blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
			objectOwnership: ObjectOwnership.BUCKET_OWNER_PREFERRED,
		});

		new CfnOutput(this, "WebsiteBucket", {
			value: this.bucket.bucketName,
			description: `The deployment bucket for ${siteUrl}`,
		});
	}
}
