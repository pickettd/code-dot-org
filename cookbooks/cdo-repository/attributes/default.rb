#
# NOTE: Uses ssh by default but a role can override to use https
#
default['cdo-repository'] = {
  'repository' => 'git@github.com:code-dot-org/code-dot-org.git',
  'timeout' => 600,
}
