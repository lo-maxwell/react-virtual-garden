## I can no longer connect to my rds through the bastion host! ##
  * When running `ssh -i secrets/virtual-garden-ec2-instance.pem -L 5433:database-1.XXX.us-west-1.rds.amazonaws.com:5432 ec2-user@XXX.XXX`, connection times out
  * Check `aws ec2 describe-security-groups --group-ids sg-XXX --query 'SecurityGroups[*].IpPermissions' --output json` to make sure your ip is still whitelisted
  * Get ip here: `curl -s ifconfig.me`
  * If the ip is no longer allowed by the inbound security group, change it with `aws ec2 authorize-security-group-ingress --group-id sg-XXX --protocol tcp --port 22 --cidr NEW.IP/32 --description "SSH for current location"` or through aws console.