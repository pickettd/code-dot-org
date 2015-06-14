#
# Cookbook Name:: cdo-repository
# Recipe:: default
#

include_recipe "cdo-github-access"

template "/home/#{node[:current_user]}/.gemrc" do
  source 'gemrc.erb'
  user node[:current_user]
  group node[:current_user]
end

git "/home/#{node[:current_user]}/#{node.chef_environment}" do
  repository node['cdo-repository']['repository']
  action :checkout
  checkout_branch node.chef_environment
  user node[:current_user]
  timeout node['cdo-repository']['timeout']
  notifies :run, "execute[select-upstream-branch]", :immediately
end

execute "select-upstream-branch" do
  command "git branch --set-upstream-to=origin/#{node.chef_environment} #{node.chef_environment}"
  cwd "/home/#{node[:current_user]}/#{node.chef_environment}"
  action :nothing
end
