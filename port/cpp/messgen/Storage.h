#pragma once

#include "MemoryAllocator.h"
#include "MessageInfo.h"

namespace messgen {

template <class T, size_t MEM_SIZE, bool D = T::HAS_DYNAMICS>
class Storage {};


template <class T, size_t MEM_SIZE, true>
class Storage {
public:
    Storage() = default;

    Storage(const Storage<T> &other) = delete;

    Storage(const Storage<T> && other) = delete;

    operator= (const Storage<T> &other) = delete;

    operator= (const Storage<T> &&other) = delete;

    T& operator-> () {
        return get();
    }

    const T& operator-> () const {
        return get();
    }

    T& get() {
        return _value;
    }

    const T& get() const {
        return _value;
    }

    size_t serialize_msg(uint8_t *buf) const {
        return _value.serialize_msg(buf);
    }

    int parse_msg(const uint8_t *buf, uint32_t len) {
        return _value.parse_msg(buf, len, _alloc.get());
    }

private:
    T _value;
    StaticMemoryAllocator<MEM_SIZE> _alloc;
};

template <class T, size_t MEM_SIZE, false>
class Storage {
public:
    Storage() = default;

    Storage(const Storage<T> &other) = delete;

    Storage(const Storage<T> && other) = delete;

    operator= (const Storage<T> &other) = delete;

    operator= (const Storage<T> &&other) = delete;

    T& operator-> () {
        return get();
    }

    const T& operator-> () const {
        return get();
    }

    T& get() {
        return _value;
    }

    const T& get() const {
        return _value;
    }

    size_t serialize_msg(uint8_t *buf) const {
        return _value.serialize_msg(buf);
    }

    int parse_msg(const uint8_t *buf, uint32_t len) {
        return _value.parse_msg(buf, len, _alloc.get());
    }

private:
    T _value;
    StaticMemoryAllocator<MEM_SIZE> _alloc;
};

}