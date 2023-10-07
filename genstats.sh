branch=develop

# Check tool tokei is available
if ! [ -x "$(command -v tokei)" ]; then
  echo 'Error: tokei is not installed.' >&2
  exit 1
fi

#check for node
if ! [ -x "$(command -v node)" ]; then
  echo 'Error: node is not installed.' >&2
  exit 1
fi

# Check you are in a git repo
if ! [ -d .git ]; then
  echo 'Error: not in a git repo.' >&2
  exit 1
fi

# make directory at location of script
mkdir -p $(dirname $0)/working

echo "WARNING: This will delete any working files in the working directory"
read -p "Press enter to continue"

# Loop over commits
for commit in $(git rev-list $branch)
do
  # check out the commit - force checkout 
  git checkout -f $commit

  # Output progress
  date=$(git show -s --format=%ci $commit | cut -d' ' -f1,2 | sed 's/ /T/')
  echo $commit $date

  # run tokei and save output to file in working directory
  tokei --output json > $(dirname $0)/working/$date-$commit.json
done

# put repo back to head of branch selected
git checkout $branch

# Run pnpm script to generate stats in the genstats directory
cd $(dirname $0)
pnpm run parse
pnpm run start