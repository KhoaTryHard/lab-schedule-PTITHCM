#!/usr/bin/env bash
set -e

git checkout develop

for branch in \
  feature/auth \
  feature/user-management \
  feature/room-management \
  feature/academic-data \
  feature/schedule-request \
  feature/schedule-auto-arrange \
  feature/schedule-constraint \
  feature/frontend-layout \
  feature/frontend-schedule \
  feature/testing-report
do
  git branch "$branch" 2>/dev/null || true
done

git branch
