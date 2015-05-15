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
  # within the machine from a port on the host machine. In the example below,
  # accessing "localhost:8080" will access port 80 on the guest machine.
  config.vm.network "forwarded_port", guest: 3000, host: 3000
  config.vm.network "forwarded_port", guest: 3001, host: 3001

  # Provider-specific configuration so you can fine-tune various
  # backing providers for Vagrant. These expose provider-specific options.
  # Example for VirtualBox:
  #
  config.vm.provider "virtualbox" do |vb|
     # Display the VirtualBox GUI when booting the machine
  #   vb.gui = true

     # Customize the amount of memory on the VM:
     vb.memory = "2048"
   end

  # Enable provisioning with a shell script. Additional provisioners such as
  # Puppet, Chef, Ansible, Salt, and Docker are also available. Please see the
  # documentation for more information about their specific syntax and use.
  config.vm.provision "shell", privileged: false, inline: <<-SHELL
    export CDO_CHEF_NODE_NAME="vagrant"
    export CDO_CHEF_ORG_NAME="code-dot-org"
    export CDO_CHEF_SERVER_URL="http://127.0.0.1:8889"

    sudo aptitude update
    sudo aptitude install -q -y ruby-dev build-essential

    # The following line installs chefdk to get the berks tools,
    # Chef can also be installed from the downloaded install script: sudo bash ./install.sh -v 11.16.4
    sudo wget -N --quiet opscode.com/chef/install.sh && sudo bash ./install.sh -P chefdk -v 0.4.0

    sudo gem install chef-zero --no-rdoc --no-ri
    sudo gem install chef -v 11.16.4 --no-rdoc --no-ri

    mkdir ~/.chef
    openssl genrsa 2048 > ~/.chef/$CDO_CHEF_NODE_NAME.pem 2>/dev/null
    sudo cp -f ~/.chef/$CDO_CHEF_NODE_NAME.pem /etc/chef/validation.pem
    sudo cp -f ~/.chef/$CDO_CHEF_NODE_NAME.pem /etc/chef/client.pem
    sudo chmod 777 /etc/chef/validation.pem
    sudo chmod 777 /etc/chef/client.pem
    sudo chmod a+r /etc/chef/client.rb

    # The apps cookbook looks for the project code in the user's homedir,
    # so the project folder is linked there.
    cp -rs /vagrant/ ~/development
    cd ~/development
    berks install -b cookbooks/Berksfile
    echo 'Starting chef-zero'
    sudo chef-zero &
    # The following command makes sure chef-zero is killed when the provisioning is over
    trap 'sudo kill $(jobs -pr)' SIGINT SIGTERM EXIT

    knife environment create development -d "The dev environment."
    knife node create $CDO_CHEF_NODE_NAME --disable-editing
    knife node environment_set $CDO_CHEF_NODE_NAME development
    berks upload -b cookbooks/Berksfile
    knife upload cookbooks

    knife role from file .chef/vagrant_dev_role.json
    knife node run_list add $CDO_CHEF_NODE_NAME "role[vagrant_dev]"

    sudo chef-client -S $CDO_CHEF_SERVER_URL -N $CDO_CHEF_NODE_NAME
  SHELL
end
