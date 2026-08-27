import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { shouldKeepChatStuckToBottom } from '../src/hooks/useStickChatToBottom.js'

describe('shouldKeepChatStuckToBottom', () => {
  it('stays stuck when still near the bottom', () => {
    assert.equal(shouldKeepChatStuckToBottom({
      distanceFromBottom: 20,
      heightGrew: false,
      currentlySticking: true,
    }), true)
  })

  it('unsticks when the user scrolls up', () => {
    assert.equal(shouldKeepChatStuckToBottom({
      distanceFromBottom: 400,
      heightGrew: false,
      currentlySticking: true,
    }), false)
  })

  it('keeps the stick lock when a new bubble grows the list', () => {
    assert.equal(shouldKeepChatStuckToBottom({
      distanceFromBottom: 260,
      heightGrew: true,
      currentlySticking: true,
    }), true)
  })

  it('does not jump to the latest while reading history', () => {
    assert.equal(shouldKeepChatStuckToBottom({
      distanceFromBottom: 800,
      heightGrew: true,
      currentlySticking: false,
    }), false)
  })
})
