# -*- mode: ruby -*-
# vi: set ft=ruby :

# All Vagrant configuration is done below. The "2" in Vagrant.configure
# configures the configuration version (we support older styles for
# backwards compatibility). Please don't change it unless you know what
# you're doing.
Vagrant.configure(2) do |config|
  # The most common configuration options are documented and commented below.
  # For a complete reference, please see the online documentation at
  # https://docs.vagrantup.com.

  # Every Vagrant development environment requires a box. You can search for
  # boxes at https://atlas.hashicorp.com/search.
  config.vm.box = "ubuntu/trusty64"

  # Create a forwarded port mapping which allows access to a specific port
  # within the machine from a port on the host machine.
  config.vm.network "forwarded_port", guest: 8080, host: 8080
  config.vm.network "forwarded_port", guest: 8081, host: 8081

  # Provider-specific configuration so you can fine-tune various
  # backing providers for Vagrant. These expose provider-specific options.
  config.vm.provider "virtualbox" do |vb|
    # Display the VirtualBox GUI when booting the machine
    # vb.gui = true

    # Customize the amount of memory on the VM:
    vb.memory = "2048"
  end

  # The following shell provisioner sets up an 8GB swapfile if
  # one doesn't exist already.
  config.vm.provision "shell", privileged: true, inline: <<-SHELL1
    grep -q "swapfile" /etc/fstab

    if [ $? -ne 0 ]; then
      echo 'swapfile not found. Adding swapfile.'
      fallocate -l 8000M /swapfile
      chmod 600 /swapfile
      mkswap /swapfile
      swapon /swapfile
      echo '/swapfile none swap defaults 0 0' >> /etc/fstab
    else
      echo 'swapfile found. No changes made.'
    fi
  SHELL1

  # The following chef client provisioner contacts CDO's chef server
  # and sets up the VM with the adhoc environment in the unmonitored-standalone role.
  # The node name must be unique and not already exist on the chef server (delete between provisionings).
  # The code-dot-org-validator.pem file must be in the project root directory with the Vagrantfile.
  config.vm.provision "chef_client" do |chef|
    chef.version = "11.16.4"
    chef.chef_server_url = "https://api.opscode.com/organizations/code-dot-org"
    chef.validation_key_path = "code-dot-org-validator.pem"
    chef.validation_client_name = "code-dot-org-validator"
    chef.node_name = "pickettd"
    chef.environment = "adhoc"
    chef.add_role "unmonitored-standalone"
    chef.enable_reporting = false
    chef.attempts = 2

    chef.delete_node = false
    chef.delete_client = false
  end

end
