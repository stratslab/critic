/* -*- mode: js; indent-tabs-mode: nil -*-

 Copyright 2012 Jens Lindström, Opera Software ASA

 Licensed under the Apache License, Version 2.0 (the "License"); you may not
 use this file except in compliance with the License.  You may obtain a copy of
 the License at

   http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 License for the specific language governing permissions and limitations under
 the License.

*/

"use strict";

function editNewBranch(button)
{
  var dropdown = $("select#newbranch");
  var selected = dropdown.val();

  dropdown.replaceWith("<input id=newbranch>");

  $("input#newbranch").val(selected);

  $(button).remove();
}

function fetchBranch()
{
  var newbranch = "refs/heads/" + $("#newbranch").val().trim();
  var upstream = $("#upstream").val().trim();

  if (!newbranch)
  {
    showMessage("Invalid input!", "Invalid input!", "Please provide a non-empty branch name.");
    return;
  }

  if (!upstream)
  {
    showMessage("Invalid input!", "Invalid input!", "Please provide a non-empty upstream.");
    return;
  }

  function finish(result)
  {
    if (result)
      location.href = ("/rebasetrackingreview" +
		       "?review=" + encodeURIComponent(review.id) +
		       "&newbranch=" + encodeURIComponent(newbranch) +
		       "&upstream=" + encodeURIComponent(upstream) +
		       "&newhead=" + encodeURIComponent(result.head_sha1) +
		       "&newupstream=" + encodeURIComponent(result.upstream_sha1));
  }

  var operation = new Operation({ action: "fetch remote branch",
				  url: "fetchremotebranch",
				  data: { repository_name: repository.name,
					  remote: trackedbranch.remote,
					  branch: newbranch,
					  upstream: upstream },
				  wait: "Fetching branch...",
				  callback: finish });

  operation.execute();
}

function rebaseReview()
{
  function finish(result)
  {
    if (result)
      location.replace("/r/" + review.id);
  }

  var operation = new Operation({ action: "rebase review",
				  url: "rebasereview",
				  data: { review_id: review.id,
					  new_head_sha1: check.new_head_sha1,
					  new_upstream_sha1: check.new_upstream_sha1,
					  new_trackedbranch: check.new_trackedbranch },
				  wait: "Rebasing review...",
				  callback: finish });

  operation.execute();
}

$(function ()
  {
    function updateConflictsStatus(result)
    {
      if (result)
      {
	var message;

	if (result.has_conflicts && result.has_changes)
	  message = "Has conflicts and other changes.";
	else if (result.has_conflicts)
	  message = "Has conflicts.";
	else if (result.has_conflicts)
	  message = "Has unexpected changes!";

	var status_conflicts = $("#status_conflicts");

	status_conflicts.text(message || "Clean.");

	if (message)
	  status_conflicts.attr("href", "/showcommit?repository=" + repository.id + "&sha1=" + result.merge_sha1 + "&conflicts=yes");

	$("button#rebasereview").removeAttr("disabled").button("refresh");
      }
    }

    function updateMergeStatus(result)
    {
      if (result)
      {
	var message;

	if (result.has_conflicts)
	  message = "Will need review.";

	var status_merge = $("#status_merge");

	status_merge.text(message || "Clean.");

	if (message)
	  status_merge.attr("href", "/showcommit?repository=" + repository.id + "&sha1=" + result.merge_sha1);

	var conflicts_status = new Operation({ action: "check conflicts status",
					       url: "checkconflictsstatus",
					       data: { review_id: review.id,
						       merge_sha1: result.merge_sha1 },
					       callback: updateConflictsStatus });

	conflicts_status.execute();

	$("#status_conflicts").text("Checking...");
      }
    }

    if (check)
    {
      var merge_status = new Operation({ action: "check merge status",
					 url: "checkmergestatus",
					 data: { review_id: review.id,
						 old_head_sha1: check.old_head_sha1,
						 new_head_sha1: check.new_head_sha1,
						 new_upstream_sha1: check.new_upstream_sha1 },
					 callback: updateMergeStatus });

      merge_status.execute();

      $("#status_merge").text("Checking...");
    }
  });